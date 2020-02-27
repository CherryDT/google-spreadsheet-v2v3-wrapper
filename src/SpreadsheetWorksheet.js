'use strict'

const { unpromisifyAllMethods } = require('./unpromisify')
const { SpreadsheetRow } = require('./SpreadsheetRow')
const { SpreadsheetCell } = require('./SpreadsheetCell')

class SpreadsheetWorksheet {
  /*
    v2 format:
    <SpreadsheetWorksheet> {
      addRow: <fn>,
      bulkUpdateCells: <fn>,
      clear: <fn>,
      colCount,
      del: <fn>,
      getCells: <fn>,
      getRows: <fn>,
      id, // "od6" for example? - v3 returns a different ID!
      resize: <fn>,
      rowCount,
      setHeaderRow: <fn>,
      setTitle: <fn>,
      title,
      url: <url> // with e.g. "/od6" instead of "/private/full" - not returned in v3
    }
   */

  constructor (v3, spreadsheet) {
    this.v3 = v3
    this.spreadsheet = spreadsheet
  }

  async updateHeaderRow () { // Additional method
    await this.v3.loadHeaderRow()
    await this._ensureColumnsLoaded()
  }

  _v2ifyField (caption) {
    return String(caption).replace(/[^\w-]/g, '').toLowerCase()
  }

  async _ensureColumnsLoaded () {
    if (!this.v3.headerValues) await this.v3.loadHeaderRow()

    if (this.v3.headerValues.join(';') === Object.keys((this._v3ToV2HeaderMap || {})).join(';')) return

    // In v2, we had fields in a normalized way in the API - recreate this behavior
    this._v2ToV3HeaderMap = {}
    for (const field of this.v3.headerValues) {
      const v2Field = this._v2ifyField(field)
      if (!field || !v2Field) continue
      this._v2ToV3HeaderMap[v2Field] = field
    }
  }

  async addRow (data) {
    await this._ensureColumnsLoaded()

    const v3Data = {}
    for (const [key, value] of Object.entries(data)) {
      const v2Key = this._v2ifyField(key)
      const v3Key = this._v2ToV3HeaderMap[v2Key]
      if (v3Key) v3Data[v3Key] = value
    }

    await this.v3.addRow(v3Data)
  }

  async bulkUpdateCells (cells) {
    // Only save changed cells, see https://github.com/theoephraim/node-google-spreadsheet/issues/308
    const filteredV3Cells = cells.map(c => c.v3).filter(v3Cell => v3Cell._draftData.value !== undefined)
    if (!filteredV3Cells.length) return
    await this.v3.saveCells(filteredV3Cells)
  }

  async clear () {
    await this.v3.clear()
  }

  get colCount () {
    return this.v3.columnCount
  }

  async del () {
    await this.v3.del()
    this.spreadsheet._updateWorksheets()
  }

  async getCells ({ 'min-row': minRow, 'max-row': maxRow, 'min-col': minCol, 'max-col': maxCol, 'return-empty': returnEmpty } = {}) {
    await this.v3.loadCells({
      startRowIndex: minRow ? minRow - 1 : undefined,
      endRowIndex: maxRow || undefined, // exclusive
      startColumnIndex: minCol ? minCol - 1 : undefined,
      endColumnIndex: maxCol || undefined // exclusive
    })

    if (!minRow) minRow = 1
    if (!maxRow || maxRow > this.v3.rowCount) maxRow = this.v3.rowCount
    if (!minCol) minCol = 1
    if (!maxCol || maxCol > this.v3.columnCount) maxCol = this.v3.columnCount

    const cells = []
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const v3Cell = this.v3.getCell(r - 1, c - 1)
        if (v3Cell.value === null && !returnEmpty) continue
        cells.push(new SpreadsheetCell(v3Cell, this))
      }
    }

    return cells
  }

  async getRows ({ offset, limit, orderBy, reverse, query } = {}) {
    await this._ensureColumnsLoaded()
    if (orderBy || reverse || query) throw new Error('The orderBy/reverse/query options are no longer supported for getRows!')
    const v3Rows = await this.v3.getRows({
      offset: offset ? offset - 1 : undefined,
      limit
    })
    return v3Rows.map(v3Row => new SpreadsheetRow(v3Row, this))
  }

  get id () {
    return this.v3.sheetId // Different ID than in v2!
  }

  async resize ({ rowCount, colCount: columnCount } = {}) {
    await this.v3.resize({ rowCount, columnCount })
  }

  get rowCount () {
    return this.v3.rowCount
  }

  async setHeaderRow (row) {
    await this.v3.setHeaderRow(row)
  }

  async setTitle (title) {
    await this.v3.updateProperties({ title })
  }

  get title () {
    return this.v3.title
  }

  get url () {
    throw new Error('Not implemented')
  }

  toJSON () {
    return {
      id: this.id,
      title: this.title,
      rowCount: this.rowCount,
      colCount: this.colCount
    }
  }
}

unpromisifyAllMethods(SpreadsheetWorksheet.prototype)

module.exports = { SpreadsheetWorksheet }
