const path = require('path')
const express = require('express')
const xss = require('xss')
const NoteService = require('./notes-service')

const noteRouter = express.Router()
const jsonParser = express.json()

const serializeNote = note => ({
  id: note.id,
  name: xss(note.name),
  modified: note.modified,
  folderid: note.folderid,
  content: xss(note.content)
})

noteRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    NoteService.getNotes(knexInstance)
      .then(notes => {
        res.json(notes.map(serializeNote))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { name, folderid, content } = req.body
    const newNote = { name, folderid, content }

    for (const [key, value] of Object.entries(newNote))
    if (value == null)
    return res.status(400).json({
      error: { message: `Missing '${key}' in request body` }
    })

    newNote.modified = new Date();

    NoteService.insertNote(
      req.app.get('db'),
      newNote
    )
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(serializeNote(note))
      })
      .catch(next)
  })

noteRouter
  .route('/:note_id')
  .all((req, res, next) => {
    if(isNaN(parseInt(req.params.note_id))) {
      return res.status(404).json({
        error: { message: `Invalid id` }
      })
    }
    NoteService.getNoteById(
      req.app.get('db'),
      req.params.note_id
    )
      .then(note => {
        if (!note) {
          return res.status(404).json({
            error: { message: `Note doesn't exist` }
          })
        }
        res.note = note
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(serializeNote(res.note))
  })
  .delete((req, res, next) => {
    NoteService.deleteNote(
      req.app.get('db'),
      req.params.note_id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { name } = req.body
    const noteToUpdate = { name }

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must content either 'name'.`
        }
      })

    NoteService.updateNote(
      req.app.get('db'),
      req.params.note_id,
      noteToUpdate
    )
      .then(updatedNote => {
        res.status(200).json(serializeNote(updatedNote[0]))
      })
      .catch(next)
  })

module.exports = noteRouter