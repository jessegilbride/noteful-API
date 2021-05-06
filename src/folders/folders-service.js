const FolderService = {
  getFolders(db) {
    return db
      .from('folders')
      .select(
        'folders.id',
        'folders.name',
      )
  },
  getFolderById(db, folder_id) {
    return db
      .from('folders')
      .select(
        'folders.id',
        'folders.name',
      )
      .where('folder.id', folder_id)
      .first()
  },
  insertFolder(db, newFolder) {
    return db
      .insert(newFolder)
      .into('folders')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },
  deleteFolder(db, folder_id) {
    return db('folders')
      .where({'id': folder_id})
      .delete()
  },
  updateFolder(db, folder_id, newFolder) {
    return db('folders')
      .where({id: folder_id})
      .update(newFolder, returning=true)
      .returning('*')
  }

}

module.exports = FolderService