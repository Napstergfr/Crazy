function DisableAllButMonday(s, e) {
    if (e.date.getDay() != 1)
        e.isDisabled = true;
}

function FileExportCompleted(s, e) {
    alert(e.errorText);
    alert(e.callbackData);
}

function FileExportCompleted(s, e) {
    //<a href="/Admin/GetExportedSpreadsheet?file=example" target="_blank">Download Here</a>
    if (e.errorText) {
        $('#exportResultDiv').html(e.errorText);
    }
    else {
        $('#exportResultDiv').html('Export completed. <a href="Admin/GetExportedSpreadsheet?file=' + e.callbackData + '">Download spreadsheet</a>');
    }
    $('#exportResultDiv').show();
}

function FileImportCompleted(s, e) {
    if (e.errorText) {
        $('#importResultDiv').html(e.errorText);
    }
    else {
        $('#importResultDiv').html('Import completed.');
    }
    $('#exportResultDiv').show();
}

function ExportFileChanged(s, e) {
    if (s.GetText()) {
        $('#exportResultDiv').hide();
    }
}

function ImportFileChanged(s, e) {
    if (s.GetText()) {
        $('#importResultDiv').hide();
    }
}

function InventoryTypeCombo_SelectedIndexChanged(s, e) {
    var val = s.GetValue();
    SetSoldField(val);
}

function InventoryTypeCombo_Init(s, e) {
    var val = s.GetValue();
    SetSoldField(val);
}

function SetSoldField(totalType) {
    //Disable the "sold" field if inventory type is 0 (Addition)
    if (Number(totalType) == 0) {
        Sold.SetValue(0);
        Sold.SetEnabled(false);
    }
    else {
        Sold.SetEnabled(true);
    }
}
