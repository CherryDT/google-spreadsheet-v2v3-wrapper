# google-spreadsheet-v2v3-wrapper

<a href="https://standardjs.com" style="float: right; padding: 0 0 20px 20px;"><img src="https://cdn.rawgit.com/feross/standard/master/sticker.svg" alt="Standard JavaScript" width="100" align="right"></a>

By David Trapp

Feature-incomplete wrapper of the [`google-spreadsheet` package](https://theoephraim.github.io/node-google-spreadsheet/) to map its new v3 interface (which uses Google Sheets API v4) to the [old v2 interface](https://github.com/theoephraim/node-google-spreadsheet/tree/v2-warning) for compatibility - this is for people like me who discovered last-minute that there are some production apps out there that need to be updated to use Google Sheets API v4 (`google-spreadsheet` package v3) before the old API v3 (used by `google-spreadsheet` v2) is turned off on March 3rd, 2020.

To use this wrapper, just replace `google-spreadsheet` with `google-spreadsheet-v2v3-wrapper` and cross your fingers. Also, you may need to enable access to the "Google Sheets" API for your service account.

The wrapper supports callbacks (but also returns promises), and it takes care of emulating the previous behavior of column name normalization and 1-based indices.

There are a few limitations of course - if those apply to you, you will have to work around them in your code:

* It needs node 10+. (There may be a way to transpile it using Babel to support older node.js versions in case you can't upgrade, but I didn't play around with that.)
* The usage of `getRows` with `orderBy`, `reverse` or `query` is **not supported** and will throw!
* Writing to fields in non-normalized form (not all-lowercase without spaces) will not work.
* `setAuthToken` is not supported and will throw. Only `useServiceAccountAuth` is supported.
* Some data like author and last update date is simply not returned in the new API. Attempts to access these fields will throw an error.
* The IDs returned for sheets and rows are not compatible with those returned by the old API.
* Formulae are using the **A1 format instead of R1C1**, and this wrapper does **not** convert the format!
* Since the new API doesn't have a row-based access model with column headers and `google-spreadsheet` is emulating this behavior with a cached header row, this means that mixing row- and cell-based writes and reads, or concurrent writes and reads from several applications/instances on the same sheet, will mess up your state. You may fix it by calling `worksheet.updateHeaderRow()` (async).
* `makeFeedRequest` is not supported and will throw.
* `v3`, `worksheet` and `spreadsheet` are now also "reserved words" in rows and cannot be used as column headers.
* `getRows` and `addRow` may return different instances of the same row. (However, worksheet instances are always unique.)
* Errors are not normalized.

You can access the corresponding v3 object of all the classes using the `v3` property.

Also, this was done in a pretty quick and dirty manner and not fully tested. It is provided as-is.

This project is under the MIT license.
