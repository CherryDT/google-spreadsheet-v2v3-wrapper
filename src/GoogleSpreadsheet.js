'use strict'

const { unpromisifyAllMethods } = require('./unpromisify')
const { GoogleSpreadsheet: GoogleSpreadsheetV3 } = require('google-spreadsheet')
const { SpreadsheetWorksheet } = require('./SpreadsheetWorksheet')
const { SpreadsheetRow } = require('./SpreadsheetRow')

class GoogleSpreadsheet {
  constructor (sheetId) {
    this.v3 = new GoogleSpreadsheetV3(sheetId)
    this._worksheetsById = {}

    /*
      v2 format:
      {
        getInfo () => {
          author: {name, email}, // not returned in v3
          id: <url>,
          title,
          updated: <isoDate>, // not returned in v3
          worksheets: [<SpreadsheetWorksheet>]
        },

        addRow: <fn>,
        addWorksheet: <fn>,
        getCells: <fn>,
        getInfo: <fn>,
        getRows: <fn>,
        isAuthActive: <fn>,
        makeFeedRequest: <fn>,
        removeWorksheet: <fn>,
        setAuth: <fn>,
        setAuthToken: <fn>,
        useServiceAccountAuth: <fn>
      }
    */

    const spreadsheet = this
    this.info = {
      id: `https://spreadsheets.google.com/feeds/worksheets/${sheetId}/private/full`,
      get author () {
        throw new Error('Not implemented')
      },
      get title () {
        return spreadsheet.v3.title
      },
      get updated () {
        throw new Error('Not implemented')
      },
      get worksheets () {
        return spreadsheet.worksheets
      },
      toJSON () {
        return {
          id: this.id,
          title: this.title,
          worksheets: this.worksheets
        }
      }
    }
  }

  _updateWorksheets () {
    // Don't reinstantiate worksheets unless required

    this.worksheets = []
    for (const v3Worksheet of this.v3.sheetsByIndex) {
      const worksheet = this._worksheetsById[v3Worksheet.sheetId] || new SpreadsheetWorksheet(v3Worksheet, this)
      this.worksheets.push(worksheet)
    }

    this._worksheetsById = {}
    for (const worksheet of this.worksheets) {
      this._worksheetsById[worksheet.v3.sheetId] = worksheet
    }
  }

  async _ensureInfoLoaded () {
    if (!this.v3._rawProperties) {
      await this.v3.loadInfo()
      this._updateWorksheets()
    }
  }

  get id () {
    return this.v3.spreadsheetId
  }

  get url () {
    return this.info.id
  }

  async useServiceAccountAuth (creds) {
    await this.v3.useServiceAccountAuth(creds)
  }

  async setAuth () {
    throw new Error('Not implemented (and deprecated by Google a long time ago)')
  }

  async setAuthToken () {
    throw new Error('Not implemented')
  }

  isAuthActive () {
    return !!this.v3.authMode
  }

  async makeFeedRequest () {
    throw new Error('Not implemented')
  }

  async getInfo () {
    await this._ensureInfoLoaded()
    return this.info
  }

  async addRow (worksheetIndex, row) {
    await this._ensureInfoLoaded()
    const worksheet = this.worksheets[worksheetIndex - 1]
    if (!worksheet) throw new Error(`Worksheet index ${worksheetIndex} not found`)
    const v3Row = await worksheet.addRow(row)
    return new SpreadsheetRow(v3Row, worksheet)
  }

  async addWorksheet ({ title, rowCount, colCount: columnCount, headers } = {}) {
    await this._ensureInfoLoaded()
    const v3Worksheet = await this.v3.addSheet({ title })
    if (rowCount || columnCount) {
      if (headers && columnCount > 0 && columnCount < headers.length) {
        columnCount = headers.length
      }
      await v3Worksheet.resize({ rowCount, columnCount })
    }
    if (headers) await v3Worksheet.setHeaderRow(headers)
    this._updateWorksheets()
    return this._worksheetsById[v3Worksheet.sheetId]
  }

  async getCells (worksheetIndex, opts) {
    await this._ensureInfoLoaded()
    const worksheet = this.worksheets[worksheetIndex - 1]
    if (!worksheet) throw new Error(`Worksheet index ${worksheetIndex} not found`)
    const cells = await worksheet.getCells(opts)
    return cells
  }

  async getRows (worksheetIndex, opts) {
    await this._ensureInfoLoaded()
    const worksheet = this.worksheets[worksheetIndex - 1]
    if (!worksheet) throw new Error(`Worksheet index ${worksheetIndex} not found`)
    const cells = await worksheet.getRows(opts)
    return cells
  }

  async removeWorksheet (sheet) {
    if (sheet instanceof SpreadsheetWorksheet) {
      await sheet.del()
    } else if (this._worksheetsById[sheet]) {
      await this._worksheetsById[sheet].del()
    } else if (this.worksheets[sheet]) {
      await this.worksheets[sheet].del()
    } else {
      throw new Error(`Worksheet ${sheet} not found`)
    }
  }

  toJSON () {
    return {
      id: this.id,
      info: this.info
    }
  }
}

unpromisifyAllMethods(GoogleSpreadsheet.prototype)

module.exports = { GoogleSpreadsheet }
