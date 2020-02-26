'use strict'

const { unpromisifyAllMethods } = require('./unpromisify')

class SpreadsheetCell {
  /*
    v2 Format:
    <SpreadsheetCell> {
      batchId: <R1C1>,
      col: <1-index>,
      formula, // or undefined
      numericValue, // or undefined
      row: <1-index>,
      spreadsheet: <GoogleSpreadsheet>,
      ss: <spreadsheet ID>,
      value, // String!
      valueForSave, // formula or value (String!) - Internal
      ws_id: <1-index>, // worksheet index

      del: <fn>,
      getEdit: <fn>, // Internal
      getId: <fn>, // Internal
      getSelf: <fn>, // Internal
      save: <fn>,
      setValue: <fn>,
      updateValuesFromResponseData: <fn> // Internal

      // id ?
    }
   */

  constructor (v3, worksheet) {
    this.v3 = v3
    this.worksheet = worksheet
    this.spreadsheet = worksheet.spreadsheet
  }

  get batchId () {
    return `R${this.row}C${this.col}`
  }

  get col () {
    return this.v3.columnIndex + 1
  }

  get formula () { // Note: This wrapper does NOT reformat the formula from A1 to R1C1!
    if (this.v3._draftData.valueType === 'formulaValue') {
      return this.v3._draftData.value
    } else if (this.v3._draftData.value !== undefined) {
      return undefined
    } else if (this.v3.formula !== null) {
      return this.v3.formula
    } else {
      return undefined
    }
  }

  set formula (v) {
    if (v === undefined) {
      this.v3.formula = null
    } else {
      this.v3.formula = v
    }
  }

  get id () { // Different ID!
    return this.v3.a1Address
  }

  get numericValue () {
    if (this.v3._draftData.valueType === 'numberValue') {
      return this.v3._draftData.value
    } else if (this.v3._draftData.value !== undefined) {
      return undefined
    } else if (this.v3.valueType === 'numberValue') {
      return this.v3.value
    } else {
      return undefined
    }
  }

  set numericValue (v) {
    this.v3.value = Number(v)
  }

  get row () {
    return this.v3.rowIndex + 1
  }

  get ss () {
    return this.spreadsheet.v3.spreadsheetId
  }

  get value () {
    if (this.v3._draftData.valueType === 'formulaValue') {
      return undefined
    } else if (this.v3._draftData.value !== undefined) {
      return String(this.v3._draftData.value)
    } else if (this.v3.value === null) {
      return ''
    } else {
      return String(this.v3.value)
    }
  }

  set value (v) {
    if (v === undefined || v === null || v === '') {
      this.v3.value = null
    } else {
      this.v3.value = String(v)
    }
  }

  get valueForSave () {
    if (this.formula !== undefined) {
      return this.formula
    } else {
      return this.value
    }
  }

  get ws_id () { // eslint-disable-line camelcase
    return this.worksheet.v3.index + 1
  }

  async del () {
    await this.setValue('')
  }

  async save () {
    await this.v3.save()
  }

  async setValue (v) {
    this.value = v
    await this.save()
  }

  toJSON () {
    return {
      id: this.id,
      row: this.row,
      col: this.col,
      value: this.value,
      formula: this.formula,
      numericValue: this.numericValue,
      valueForSave: this.valueForSave,
      ss: this.ss,
      ws_id: this.ws_id
    }
  }
}

unpromisifyAllMethods(SpreadsheetCell.prototype)

module.exports = { SpreadsheetCell }
