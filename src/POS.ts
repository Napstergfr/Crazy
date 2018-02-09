/// <reference path="../node_modules/@types/jquery/index.d.ts"/>
/// <reference path="../node_modules/@types/maskedinput/index.d.ts"/>
/// <reference path="../node_modules/@types/bootstrap-select/index.d.ts"/>
/// <reference path="../bower_components/moment/moment.d.ts"/>
/// <reference path="./models.ts"/>

//Can't get this to look in Scripts folder or bower_components
//With tsconfig.json "moduleResolution": "node" it will find it in node_modules but without that
//setting it will not find it at all
import * as moment from 'moment';       
import * as models from './models';

//TypeScript debugging is only supported with IE and Chrome, and only if the
//.js and .map files are in the same folder as the .ts files

let _orderItems: models.OrderItem[] = [];
let _order: models.Order = new models.Order();
let _orders: models.Order[];
let _icings: models.IdName[];
let _toppings: models.IdName[];
let _cakes: models.IdName[];
let _locations: models.Store[];
let _customer: models.Customer;

$(function () {
    //Hook up the new and existing orders buttons
    //NOTE: DevExpress scripts and css prevent the following event from being raised after being
    //attached, so using bootstrap radio buttons in jquery requires a different master view without
    //the DevExpress stuff
    $('input[name="newexisting"]:radio').on('change', function () {
        $('#messageDiv').hide();
        if ($('#optionNew').prop('checked')) {
            newOrder();
        }
        else {
            $('#orderForm').trigger('reset');
            $('.div-customize').hide();
            $('#searchForm').show('slow');
            $('#orderForm').hide('slow');
        }
    });
    $('#phoneNumberInput').mask('?(999) 999-9999');
    $('#customerPhone').mask('?(999) 999-9999');
    //Hook up the existing orders search form button
    $('#searchForm').submit(function(e: JQueryEventObject) {
        getMatchingOrders();
        e.preventDefault();
    });
    $('#orderForm').submit(function (e: JQueryEventObject) {
        e.preventDefault();
        let errors: string = validate();
        if (errors) {
            errors = 'Please correct the following errors:<br /><ul>' + errors + '</ul>'
            showMessage(errors, 'danger');
            window.scrollTo(0, 0);
            return;
        }

        checkBakingHours();     //this calls checkBusinessHours and in turn SaveOrder
    });
    //Show spinner for all ajax requests
    $(document).ajaxStop(function () {
        $("#loader").hide();
    });
    $(document).ajaxStart(function () {
        $("#loader").show();
    });
    //$(document.body).on('click', 'label[name="pickupLocationLabel"], label[name="pickupDeliveryLabel"]', function () {
    //    checkBusinessHours();
    //});
    $('input:radio[name="pickupdelivery"]').on('change', function () {
        $('#deliveryInfoDiv, #pickupLocationDiv').toggleClass('nodisplay');
        if ($('#optionPickup').prop('checked')) {
            $('#readyDate').attr('placeholder', 'Pickup Date/Time');
        }
        else {
            $('#readyDate').attr('placeholder', 'Delivery Date/Time');
        }
    });
    //Bootstrap handles the showing/hiding of the div, but we need js to switch the icon
    $('#otherFlavoursBtn').on('click', function () {
        $(this).find("span:first")
            .toggleClass('glyphicon-menu-down')
            .toggleClass("glyphicon-menu-up");
    });
    $('#customFlavoursBtn').on('click', function () {
        $(this).find("span:first")
            .toggleClass('glyphicon-menu-down')
            .toggleClass("glyphicon-menu-up");
    });
    ($('#readyDateDiv') as any).datetimepicker({
        sideBySide: true,
        //buttons: {
        //    showClose: true,
        //},
        stepping: 15,
        useCurrent: false,
        minDate: new Date(),
        allowInputToggle: true
    });
    $('#readyDate').on('blur', function (e) {
        getFOW();
    });
    getLookupData();
    $('#customerSearchButton').on('click', function () {
        getCustomerByPhone();
    });
    $('#customerPhone').on('blur', function () {
        if (_customer == null) {
            getCustomerByPhone();
        }
    });
    $('#customerPhone').on('keydown', function (e: JQueryEventObject) {
        //Reset the customer object for any numeric keystroke, or others that will change
        //the contents such as backspace and delete
        var keycode = e.which;
        if (!e.shiftKey && (keycode == 46 || keycode == 8 || (keycode >= 48 && keycode <= 57))) {
            _customer = null;
        }
    });
    attachNewCustomFlavourButton();
    attachCustomizePopup();
    attachRemoveCustomFlavourButtons();
    createSpinners();

    if ($('#paramOrderId').html() != "") {
        let orderId: number = Number($('#paramOrderId').html());
        //An order id has been passed in, so make the "existing" option appear active but
        //without clicking it, because that would pull up the search screen
        $('label[name="newexisting"]').toggleClass('active');
        getOrder(orderId);
    }
});

function showModalDialog(title: string, message: string, button1Caption: string, button2Caption: string,
                            button1Function: () => void) {
    $('#modalTitle').html(title);
    $('#modalMessage').html(message);
    $('#modalButton1').html(button1Caption);
    $('#modalButton2').html(button2Caption);
    $('#modalButton1').one('click', function () {
        button1Function();
    });
    $('#modalDialog').one('hidden.bs.modal', function () {
        //remove the handler for the button in case it was never invoked, otherwise it will
        //still be there the next time the dialog is shown
        $('#modalButton1').off('click');
    })
    $('#modalDialog').modal();
}

function newOrder() {
    _order = new models.Order();
    $('#searchForm').hide('slow');
    $('#searchForm').trigger('reset');
    $('#ordersDiv').hide('slow');
    $('#noOrdersDiv').hide('slow');
    $('#orderForm').show('slow');
    $("#customerPhone").prop('disabled', false);
    $('#cancelledDiv').hide();
    getLookupData();
    clearOrderDetails();
}

function getLookupData() {
    //Because the ajax is all async, we need to make sure we have the icings and the toppings before the flavours,
    //so each api invocation invokes the next on success
    getLocations();
}

function getFOW() {
    try {
        let date: moment.Moment = ($('#readyDateDiv') as any).datetimepicker('date');
        if (date == null) {
            date = moment(new Date());
        }
        $.getJSON('https://abbygirlsweets.azurewebsites.net/data/fow?date=' + date.format('MM/DD/YYYY'))
            .done(data => {
                //Change the name and flavour id of the FOW selection
                let flav: models.Flavour = data;
                var fow = $('div.flavour[data-isfow="true"]')
                fow.data('flavourid', flav.FlavourId);
                fow.children('h4').html(flav.FlavourName);
            })
            .fail(error => {
                showMessage(error.statusText, 'danger');
            });
    }
    catch (err) {
        showMessage(err.message, 'danger');
    }
}

function getCakes() {
    try {
        $.getJSON('https://abbygirlsweets.azurewebsites.net/data/cakes')
            .done(data => {
                _cakes = data;
                getIcings();
            })
            .fail(error => {
                showMessage(error.statusText, 'danger');
            });
    }
    catch (err) {
        showMessage(err.message, 'danger');
    }
}

function getLocations() {
    try {
        $.getJSON('https://abbygirlsweets.azurewebsites.net/data/locations')
            .done(data => {
                _locations = data;
                let loc: string = "";
                _locations.forEach(location => {
                    loc += '<label name="pickupLocationLabel" class="btn btn-default">'
                        + '<input class="pickuplocation" type="radio" name="pickuplocation" id="optionPickupLocation' + location.Id
                        + '" autocomplete="off" value="' + location.Id + '">' + location.Name + '</label>';
                });
                $('#pickupLocationDiv').html(loc);
                getCakes();
            })
            .fail(error => {
                showMessage(error.statusText, 'danger');
            });
    }
    catch (err) {
        showMessage(err.message, 'danger');
    }
}

function getIcings() {
    try {
        $.getJSON('https://abbygirlsweets.azurewebsites.net/data/icings')
            .done(data => {
                _icings = data;
                let none: models.IdName = new models.IdName(0, 'None');
                _icings.push(none);
                getToppings();
            })
            .fail(error => {
                showMessage(error.statusText, 'danger');
            });
    }
    catch (err) {
        showMessage(err.message, 'danger');
    }
}

function getToppings() {
    try {
        $.getJSON('https://abbygirlsweets.azurewebsites.net/data/toppings')
            .done(data => {
                _toppings = data;
                let none: models.IdName = new models.IdName(0, 'None');
                _toppings.push(none);
                getFlavours();
            })
            .fail(error => {
                showMessage(error.statusText, 'danger');
            });
    }
    catch (err) {
        showMessage(err.message, 'danger');
    }
}

function getOrder(orderId: number) {
    try {
        $.getJSON('https://abbygirlsweets.azurewebsites.net/data/orders/' + orderId)
            .done(data => {
                _order = data;
                displayOrderDetails(_order);
            })
            .fail(error => {
                showMessage(error.statusText, 'danger');
            });
    }
    catch (err) {
        showMessage(err.message, 'danger');
    }
}

function getFlavours() {
    try {
        $.getJSON('https://abbygirlsweets.azurewebsites.net/data/flavours')
            .done(data => {
                _orderItems = data;
                displayOrderItems(_orderItems);
            })
            .fail(error => {
                showMessage(error.statusText, 'danger');
            });
    }
    catch (err) {
        showMessage(err.message, 'danger');
    }
}

function checkBakingHours(): void {

    let date: moment.Moment = ($('#readyDateDiv') as any).datetimepicker('date');
    let pickupDate: moment.Moment = moment(date.format('YYYY-MM-DD'), 'YYYY-MM-DD');
    let message: string;

    //If an order is taken on Fri, Sat, or Sun for any of the same days, let the user know
    //that baking has already taken place (on Thurs) for those three days so the order may not be able
    //to be fulfilled even though stores may be open
    let now: moment.Moment = moment();
    let orderOnFriSatSun: boolean = (now.day() == 0 || now.day() >= 5);
    let pickupOnFriSatSun: boolean = (pickupDate.day() == 0 || pickupDate.day() >= 5);
    if (orderOnFriSatSun && pickupOnFriSatSun && pickupDate.isBefore(now.day(now.day() + 7))) {
        message = '<p>Baking for the weekend has already taken place. This order may not be able to be fulfilled.</p>'
            + '<p>Do you want to proceed?</p>';
        showModalDialog('Confirm', message, 'Yes', 'No', checkBusinessHours);
    }
    else {
        checkBusinessHours();
    }
}

function checkBusinessHours(): void {
    let storeId: number;
    let storeName: string;
    let isOpen: boolean = false;

    let date: moment.Moment = ($('#readyDateDiv') as any).datetimepicker('date');
    //create a time using the same zero date that the db stores
    let pickupTime: moment.Moment = moment('0001-01-01 ' + date.format('HH:mm'), 'YYYY-MM-DD HH:mm');
    let pickupDate: moment.Moment = moment(date.format('YYYY-MM-DD'), 'YYYY-MM-DD');

    var selected = $('label[name="pickupDeliveryLabel"].active').find('input');
    if (selected.val() == 0) {
        var location = $('label[name="pickupLocationLabel"].active');
        storeId = location.find('input').val();
        storeName = location.text();
    }

    //Get the locations to consider - either for the specific store if one is selected
    //or all stores if no location is selected (ie, delivery)
    let locations: models.Store[] = []
    _locations.forEach(l => {
        if (!storeId || l.Id == storeId) {
            locations.push(l);
        }
    });

    locations.forEach(l => {
        //Check the pattern of standard open/closed days of week and hours
        l.Hours.forEach(h => {
            if (date.day() == h.Day) {
                if (pickupTime.isSameOrAfter(h.OpenTime) && pickupTime.isSameOrBefore(h.CloseTime)) {
                    isOpen = true;
                    return;     
                }
            }
        });
        //Check specific open/closed dates and times
        l.Closures.forEach(lc => {
            //compares the values down to the day granularity
            if (moment(lc.Date).isSame(pickupDate, 'day')) {
                //If no open time is specified then the whole day must be closed
                if (!lc.OpenTime) {
                    isOpen = false;
                }
                //if open time is specified, then closed time must also be specified, and these values
                //override the pattern
                else if (pickupTime.isSameOrAfter(lc.OpenTime) && pickupTime.isSameOrBefore(lc.CloseTime)) {
                    isOpen = !lc.Closed;
                }
            }
        })
        //If no store is selected then we only need one of them to be open, so no need to keep going
        if (!storeId && isOpen) {
            return;
        }
    });

    let message: string;
    if (!isOpen) {
        if (storeId) {
            message = '<p>You have selected a date and time when ' + storeName + ' is closed.</p>';
        }
        else {
            message = '<p>You have selected a date and time when all stores are closed.</p>'
        }
        message += '<p>Do you want to proceed?</p>';
        //saveOrder will be invoked if the user elects to proceed from the warning about store closures
        showModalDialog('Confirm', message, 'Yes', 'No', saveOrder);
    }
    else {
        saveOrder();
    }
}

function showMessage(message: string, alertType: string) {
    $('#messageDiv').removeClass(function (index, className) {
        return (className.match(/(^|\s)alert-\S+/g) || []).join(' ');
    });
    $('#messageDiv').addClass('alert-' + alertType);
    $('#message').html(message);
    $('#messageDiv').show();
}

function getCustomerByPhone() {
    try {
        $.getJSON('https://abbygirlsweets.azurewebsites.net/data/customers/search?phone=' + $('#customerPhone').val())
            .done(data => {
                _customer = data;
                displayCustomer(_customer);
            })
            .fail(function (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) {
                if (jqXHR.status != 404) {
                    showMessage(textStatus, 'danger');
                }
            });
    }
    catch (err) {
        showMessage(err.message, 'danger');
    }
}

function displayCustomer(customer: models.Customer) {
    $('#customerEmail').val(customer.Email);
    $('#customerFirstName').val(customer.FirstName);
    $('#customerLastName').val(customer.LastName);
    //Use the customer address as the default delivery address
    if (customer.Address != null) {
        $('#deliveryStreet').val(customer.Address.Street);
        $('#deliveryCity').val(customer.Address.City);
        $('#deliveryState').val(customer.Address.State);
        $('#deliveryZip').val(customer.Address.Zip);
    }
    else {
        $('#deliveryStreet').val("");
        $('#deliveryCity').val("Cincinatti");
        $('#deliveryState').val("OH");
        $('#deliveryZip').val("");
    }
}

function saveOrder() {
    try {
        if (_customer == null) {
            _customer = new models.Customer();
        }
        if (_order.Id != 0) {
            _order.Inactive = $('#cancelled').prop('checked');
        }
        _order.Customer = _customer;
        _order.Customer.Phone = $('#customerPhone').val();
        _order.Customer.Email = $('#customerEmail').val();
        _order.Customer.FirstName = $('#customerFirstName').val();
        _order.Customer.LastName = $('#customerLastName').val();
        _order.RecipientPhone = $('recipientPhone').val();
        _order.RecipientName = $('recipientName').val();
        _order.ForDate = $('#readyDate').val();
        _order.PickupLocation = new models.Store();
        var selected = $('label[name="pickupDeliveryLabel"].active').find('input');
        if (selected.val() == 0) {
            var location = $('label[name="pickupLocationLabel"].active').find('input');
            _order.PickupLocation = new models.Store();
            _order.PickupLocation.Id = location.val();
            _order.DeliveryAddress = null;
        }
        else {
            _order.PickupLocation = null;
            //If there was an existing delivery address, this new address will update it, otherwise
            //it will use the customer address
            let oldId: number;
            if (_order.DeliveryAddress) {
                oldId = _order.DeliveryAddress.Id;
            } 
            _order.DeliveryAddress = new models.Address();
            _order.DeliveryAddress.Id = oldId;
            _order.DeliveryAddress.Street = $('#deliveryStreet').val();
            _order.DeliveryAddress.City = $('#deliveryCity').val();
            _order.DeliveryAddress.State = $('#deliveryState').val();
            _order.DeliveryAddress.Zip = $('#deliveryZip').val();
        }
        _order.Price = Number($('#totalPrice').val());
        if (_order.Payment == null) {
            _order.Payment = new models.Payment();
        }
        _order.Payment.Amount = Number($('#amountPaid').val());
        _order.Payment.ConfirmCode = $('#confirmation').val();
        _order.Note = $('#notes').val();

        _order.OrderItems = [];
        $('.flavour').each(function () {
            let qty: number = Number($(this).find('input.flavour-qty').val());
            if (qty > 0) {
                _orderItems
                let item: models.OrderItem = new models.OrderItem();
                item.Quantity = qty;
                item.Id = $(this).data('itemid');
                item.FlavourId = $(this).data('flavourid');
                item.IsFOW = $(this).data('isfow');
                //item.CakeId = Number($(this).find('div.cake').html());
                item.CakeId = null;     //null cake indicates a base flavour
                item.FillingId = $(this).find('select.filling').val();
                item.ToppingId = $(this).find('select.topping').val();
                item.IcingId = $(this).find('select.icing').val();
                //item.FillingId = $(this).find('select.filling option:selected').val();
                //item.ToppingId = $(this).find('select.topping option:selected').val();
                //item.IcingId = $(this).find('select.icing option:selected').val();
                item.Notes = $(this).find('textarea').val();
                _order.OrderItems.push(item);
            }
        })
        $('.customitem').each(function () {
            let qty: number = Number($(this).find('input.flavour-qty').val());
            if (qty > 0) {
                _orderItems
                let item: models.OrderItem = new models.OrderItem();
                item.Quantity = qty;
                item.Id = $(this).data('itemid');
                //item.FlavourId = $(this).data('flavourid');
                item.FlavourId = null;      //null flavour indicates a completely custom item
                item.CakeId = $(this).find('select.cake').val();
                item.FillingId = $(this).find('select.filling').val();
                item.ToppingId = $(this).find('select.topping').val();
                item.IcingId = $(this).find('select.icing').val();
                //item.CakeId = $(this).find('select.cake option:selected').val();
                //item.FillingId = $(this).find('select.filling option:selected').val();
                //item.ToppingId = $(this).find('select.topping option:selected').val();
                //item.IcingId = $(this).find('select.icing option:selected').val();
                item.Notes = $(this).find('textarea').val();
                _order.OrderItems.push(item);
            }
        })

        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(_order),
            type: 'POST',
            url: '/data/orders/save'
        })
            .done(data => {
                showMessage('Order ' + data + ' saved succesfully', 'success');
                //If an existing order was edited, leave that order active, but if this was a new
                //order, clear and start again
                if (_order.Id == 0) {
                    newOrder();
                }
            })
            .fail(function (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) {
                showMessage(textStatus, 'danger');
            })
            .always(() => {
                window.scrollTo(0, 0);
            });
    }
    catch (err) {
        showMessage(err.message, 'danger');
    }
}

function validate(): string {
    let error: string = "";
    $('#messageDiv').hide();

    if (!isValidPhoneNumber($('#customerPhone').val())) {
        error += '<li>Valid customer phone is required</li>';
        $('#customerPhoneDiv').addClass('has-error');
    }
    else {
        $('#customerPhoneDiv').removeClass('has-error');
    }

    if (!($('#customerFirstName').val())) {
        error += '<li>Customer name is required</li>';
        $('#customerFirstNameDiv').addClass('has-error');
    }
    else {
        $('#customerFirstNameDiv').removeClass('has-error');
    }

    var selected = $('label[name="pickupDeliveryLabel"].active').find('input');
    if (selected.val() == 0) {
        var selected = $('label[name="pickupLocationLabel"].active').find('input');
        if (selected.length == 0) {
            $('#pickupLocationDiv').addClass('has-error')
            error += '<li>Pickup location is required</li>';
        }
        else {
            $('#pickupLocationDiv').removeClass('has-error')
        }
    }
    else {
        let deliveryError: boolean;
        if (!$('#deliveryStreet').val()) {
            $('#deliveryStreetDiv').addClass('has-error')
            deliveryError = true;
        }
        else {
            $('#deliveryStreetDiv').removeClass('has-error')
        }
        if (!$('#deliveryCity').val()) {
            $('#deliveryCityDiv').addClass('has-error')
            deliveryError = true;
        }
        else {
            $('#deliveryCityDiv').removeClass('has-error')
        }
        if (!$('#deliveryState').val()) {
            $('#deliveryStateDiv').addClass('has-error')
            deliveryError = true;
        }
        else {
            $('#deliveryStateDiv').removeClass('has-error')
        }
        if (!$('#deliveryZip').val()) {
            $('#deliveryZipDiv').addClass('has-error')
            deliveryError = true;
        }
        else {
            $('#deliveryZipDiv').removeClass('has-error')
        }
        if (deliveryError) {
            error += '<li>Delivery address incomplete</li>';
        }
    }

    let date: moment.Moment = ($('#readyDateDiv') as any).datetimepicker('date');
    if (!date) {
        $('#readyDateDiv').addClass('has-error')
        error += '<li>Valid date and time is required</li>';
    }
    else {
        $('#readyDateDiv').removeClass('has-error')
    }

    let qty: number = Number($('#actualTotalQty').find('strong').html());
    if (qty == 0) {
        error += '<li>No cupcakes selected</li>';
    }

    let hasCakeError: boolean = false;
    $('.customitem').each(function () {
        let qty: number = Number($(this).find('input.flavour-qty').val());
        if (qty > 0) {
            let cake = $(this).find('select.cake').first();
            if (!cake.val()) {
                //The error goes on the cell which is a couple of divs up
                cake.closest('.col-xs-2').addClass('has-error');
                if (!hasCakeError) {
                    error += '<li>Cake is required for custom flavours</li>';
                    hasCakeError = true;
                }
            }
            else {
                cake.closest('.col-xs-2').removeClass('has-error');
            }
        }
    })

    if ($('#requestedTotalQty').val() != "" && qty != Number($('#requestedTotalQty').val())) {
        $('#requestedTotalQtyDiv').addClass('has-error')
        error += '<li>Requested and actual totals do not match</li>';
    }
    else {
        $('#requestedTotalQtyDiv').removeClass('has-error')
    }
    return error;
}

function getMatchingOrders() {
    try {
        $.getJSON('https://abbygirlsweets.azurewebsites.net/data/orders/search?phone=' + $('#phoneNumberInput').val() + '&orderId=' + $('#orderIdInput').val())
            .done(data => {
                displayOrders(data);
            })
            .fail(function (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) {
                $('#ordersDiv').hide();
                if (jqXHR.status == 404) {
                    $('#noOrdersDiv').show();
                }
                else {
                    showMessage(textStatus, 'danger');
                }
            });
    }
    catch (err) {
        showMessage(err.message, 'danger');
    }
}

function displayOrders(orders: models.Order[]) {
    _orders = orders;
    $('#noOrdersDiv').hide();
    $('#ordersTbody').empty();
    $('#ordersDiv').show();
    orders.forEach(order => {
        let trId = "order" + order.Id;
        let status: string = (order.Inactive) ? 'Cancelled' : 'Active';
        $('#ordersTbody').append('<tr id="' + trId + '">'
            + '<td class="td-fit">' + order.Id + '</td>'
            + '<td class="td-fit">' + order.Customer.FirstName + '</td>'
            + '<td class="td-fit">' + order.Customer.LastName + '</td>'
            + '<td class="td-fit">' + order.Customer.Phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") + '</td>'
            + '<td class="td-fit">' + pickupLocationName(order.PickupLocation) + '</td>'
            + '<td class="td-fit">' + formattedAddress(order.DeliveryAddress) + '</td>'
            + '<td class="td-fit">' + order.ForDate + '</td>'
            + '<td class="td-fit">' + order.TotalQuantity + '</td>'
            + '<td class="td-fit">' + status + '</td>'
            + '</tr>')
        $('#' + trId).on('click', function () { displayOrderDetails(order); });
    });
}

function clearOrderDetails() {
    $('#customerPhone').val("");
    $('#customerEmail').val("");
    $('#customerFirstName').val("");
    $('#customerLastName').val("");
    $('#deliveryStreet').val("");
    $('#deliveryCity').val("");
    $('#deliveryState').val("");
    $('#deliveryZip').val("");
    ($('#readyDateDiv') as any).datetimepicker('date', null);
    $('#readyDate').attr('placeholder', 'Pickup Date/Time');
    $('#recipientPhone').val("");
    $('#recipientPhone').val("");
    $('label[name="pickupDeliveryLabel"]').removeClass('active');
    $('#pickupLabel').addClass('active');
    $('label[name="pickupLocationLabel"]').removeClass('active');
    $('#requestedTotalQty').val("");
    $('#actualTotalQty').html("");
    $('#totalPrice').val("");
    $('#amountPaid').val("");
    $('#confirmation').val("");
    $('#notes').val("");
    $('#deliveryInfoDiv').addClass('nodisplay');
    $('#pickupLocationDiv').removeClass('nodisplay');
}

function displayOrderDetails(order: models.Order) {
    _order = order;
    _customer = order.Customer;
    displayCustomer(_customer);
    displayOrderItems(order.OrderItems);
    getFOW();
    $('#cancelled').prop('checked', order.Inactive);
    $('#cancelledDiv').show();
    $('#customerPhone').val(_customer.Phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3"));
    $("#customerPhone").prop('disabled', true);
    ($('#readyDateDiv') as any).datetimepicker('date', _order.ForDate);
    $('#recipientPhone').val(_order.RecipientPhone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3"));
    $('#recipientPhone').val(_order.RecipientName);
    $('label[name="pickupDeliveryLabel"]').removeClass('active');
    $('label[name="pickupLocationLabel"]').removeClass('active');
    if (_order.PickupLocation != null) {
        $('#deliveryInfoDiv').addClass('nodisplay');
        $('#pickupLocationDiv').removeClass('nodisplay');
        $('#pickupLabel').addClass('active');
        $('#optionPickupLocation' + _order.PickupLocation.Id).closest('label').addClass('active')
    }
    else {
        $('#pickupLocationDiv').addClass('nodisplay');
        $('#deliveryInfoDiv').removeClass('nodisplay');
        $('#deliveryLabel').addClass('active');
        $('#deliveryStreet').val(_order.DeliveryAddress.Street);
        $('#deliveryCity').val(_order.DeliveryAddress.City);
        $('#deliveryState').val(_order.DeliveryAddress.State);
        $('#deliveryZip').val(_order.DeliveryAddress.Zip);
    }
    $('#requestedTotalQty').val(_order.TotalQuantity);
    $('#actualTotalQty').html('<strong>' + _order.TotalQuantity + '</strong>');

    $('#totalPrice').val(_order.Price);
    if (_order.Payment != null) {
        $('#amountPaid').val(_order.Payment.Amount);
        $('#confirmation').val(_order.Payment.ConfirmCode);
    }
    $('#notes').val(_order.Note);

    $('#ordersDiv').hide();
    $('#orderForm').show('slow');
}

function pickupLocationName(location: models.IdName) : string {
    if (location == null) {
        return "";
    }
    else {
        return location.Name;
    }
}

function formattedAddress(address: models.Address): string {
    if (address == null || address.Street == null) {
        return "";
    }
    else {
        return address.Street;
    }
}

function displayOrderItems(items: models.OrderItem[]) {
    if (items == null) return;

    _orderItems = items;
    let otherFlavours: boolean = false;
    let customFlavours: boolean = false;
    let otherFlavoursHtml: string = '<div class="row">';
    let primaryFlavoursHtml: string = '<div class="row">';

    let customFlavoursHtml: string = '<div class="row bottommargin10"><div class="col-xs-3">Quantity</div>'
        + '<div class="col-xs-2">Cake</div>'
        + '<div class="col-xs-2">Filling</div>'
        + '<div class="col-xs-2">Icing</div>'
        + '<div class="col-xs-2">Topping</div></div>';

    items.forEach(item => {
        if (item.FlavourId != null) {
            if (!item.Inactive) {
                primaryFlavoursHtml += displayItem(item);
            }
            else {
                //Inactive flavours get displayed under the "Other Flavours" panel
                otherFlavoursHtml += displayItem(item);
                if (item.Quantity > 0) {
                    otherFlavours = true;
                }
            }
        }
        else {
            //Custom flavours (eg created from scratch) get displayed under the "Custom Flavours" panel
            customFlavoursHtml += displayCustom(item);
            if (item.Quantity > 0) {
                customFlavours = true;
            }
        }
    })

    primaryFlavoursHtml += '</div>';    //close the row
    $('#primaryFlavoursDiv').html(primaryFlavoursHtml);  
    otherFlavoursHtml += '</div>';
    $('#otherFlavoursDiv').html(otherFlavoursHtml);

    $('#customFlavoursDiv').html(customFlavoursHtml);
    //Add an empty row for custom flavours
    customFlavoursHtml = displayCustom(null);
    $('#customFlavoursDiv').append(customFlavoursHtml);

    //For some reason creating the divs with display:none doesn't create them hidden, so hide them now
    $('.div-customize').hide();
    $('#searchForm').hide('slow');
    $('.selectpicker').selectpicker();
    setFlavourClasses(otherFlavours, customFlavours);
}

function displayCustom(item: models.OrderItem): string {
    if (item == null) item = new models.OrderItem();
    let display: string = '<div class="customitem" data-itemid="' + getId(item) + '"><div class="row bottommargin10">'
    display += '<div class="col-xs-3">'
        + '<button type="button" class="btn btn-default remove-custom-flavour"><span class="glyphicon glyphicon-remove"></span></button>'
        + '<div class="input-group"><span class="input-group-addon handcursor qty-editor-minus">'
        + '<span class="glyphicon glyphicon-minus"></span></span>'
        + '<input type="number" class="form-control qty-editor flavour-qty text-center custom-flavour" placeholder="Qty" value=' + getQuantity(item) + ' />'
        + '<span class="input-group-addon handcursor qty-editor-plus">'
        + '<span class="glyphicon glyphicon-plus"></span></span>'
        + '</div></div>';
    display += '<div class="col-xs-2">' + createSelect(_cakes, item.CakeId, 'cake','custom') + '</div>';
    display += '<div class="col-xs-2">' + createSelect(_icings, item.FillingId, 'filling', 'custom') + '</div>';
    display += '<div class="col-xs-2">' + createSelect(_icings, item.IcingId, 'icing', 'custom') + '</div>';
    display += '<div class="col-xs-2">' + createSelect(_toppings, item.ToppingId, 'topping', 'custom') + '</div></div>';
    display += '<div class="row bottommargin10"><div class="col-md-11"><textarea class="form-control fullwidth" placeholder="Notes..."></textarea></div></div></div>';
    return display;
}

function displayItem(item: models.OrderItem): string {
    //use the button class to indicate that the flavour has been customized
    let customized: string = (item.Customized == null || !item.Customized) ? "btn-default" : "btn-info";
    let inactive: string = (item.Inactive) ? "inactive-flavour" : "";
    let display: string = '<div id="flavour' + item.FlavourId + '" class="col-xs-2 flavour" '
        + 'data-itemid="' + getId(item) + '" data-flavourid="' + item.FlavourId + '" data-isfow="' + item.IsFOW + '">'
        + '<h4>' + item.FlavourName + '</h4>'
        + '<div class="input-group"><span class="input-group-addon handcursor qty-editor-minus">'
        + '<span class="glyphicon glyphicon-minus"></span></span>'
        + '<input type="number" class="form-control qty-editor flavour-qty text-center ' + inactive + '" placeholder="Qty" value=' + getQuantity(item) + ' />'
        + '<span class="input-group-addon handcursor qty-editor-plus">'
        + '<span class="glyphicon glyphicon-plus"></span></span></div>';
    //FOW can't be customized
    if (!item.IsFOW) {
        display += '<button type="button" class="btn ' + customized + ' btn-customize">'
            + '<span class="glyphicon glyphicon-cog"></span>'
            + '</button>'
            + '<div id="custom' + item.FlavourId + '" class="form-group div-customize">';
        display += '<div class="nodisplay cake">' + item.CakeId + '</div>';
        //The fillings are from the same list as the icings (the cake is filled with icing)
        display += '<div>Filling ' + createSelect(_icings, item.FillingId, 'filling', 'item') + '</div>';
        display += '<div>Icing ' + createSelect(_icings, item.IcingId, 'icing', 'item') + '</div>';
        display += '<div>Topping ' + createSelect(_toppings, item.ToppingId, 'topping', 'item') + '</div>';
        display += '<div class="topmargin10"><textarea class="form-control" placeholder="Notes..."></textarea></div></div>';
    }
    display += '</div>';
    return display;
}

function createSelect(items: models.IdName[], selectedId: number, datatype: string, tag: string): string {
    let select: string = '<select class="form-control selectpicker ' + datatype + ' ' + tag + '" title="Please select...">';
    let matched: boolean = false;
    items.forEach(item => {
        select += '<option class="' + datatype + 'option" value="' + item.Id + '"';
        if (selectedId && item.Id == selectedId) {
            select += ' selected';
            matched = true;
        }
        select += '>' + item.Name + '</option>';
    })
    select += '</select>';
    return select;
}

function setFlavourClasses(otherFlavours: boolean, customFlavours: boolean) {
    if (otherFlavours) {
        $('#otherFlavoursBtn').addClass('btn-info');
    }
    else {
        $('#otherFlavoursBtn').removeClass('btn-info');
    }
    if (customFlavours) {
        $('#customFlavoursBtn').addClass('btn-info');
    }
    else {
        $('#customFlavoursBtn').removeClass('btn-info');
    }
}

function getQuantity(item: models.OrderItem): string {
    return (item.Quantity == null) ? "" : item.Quantity.toString();
}

function getId(item: models.OrderItem): string {
    return (item.Id == null) ? "0" : item.Id.toString();
}

function attachCustomizePopup() {
    $(document.body).on('click', '.btn-customize', function () {
        let flavourId: string = $(this).parent().data('flavourid');
        if ($('#custom' + flavourId).is(':visible')) {
            //The one just clicked was already showing, so hide it
            $('#custom' + flavourId).hide();
        } else {
            //Hide any that are showing
            $('.div-customize').hide();
            //Show the one associated with the button that was just clicked 
            $('#custom' + flavourId).show();
        }
    })
}

function attachRemoveCustomFlavourButtons() {
    //By attaching an event using document, and then the parameter of the "on" method to specify the id or class, 
    //the event will be attached even when an element is added using dynamic html. 
    $(document.body).on('click', '.remove-custom-flavour', function () {
        //JQuery remove will also remove this event which is what we want since the delete button
        //is in the div being removed
        $(this).closest('.customitem').remove();
    })
}

function attachNewCustomFlavourButton() {
    $(document.body).on('click', '#addCustomFlavour', function () {
        let display: string = displayCustom(null);
        $('#customFlavoursDiv').append(display);
        $('.selectpicker').selectpicker();
    })
    $(document.body).on('changed.bs.select', '.selectpicker.item', function (e) {
        let parent = $(this).closest('.flavour');
        let flavourId: number = parent.data('flavourid');
        let flavour: models.Flavour = _orderItems.filter(item => item.FlavourId == flavourId)[0];
        let toppingId: number;
        let icingId: number;
        let fillingId: number;

        //get all the selects that make up this flavour to see if any of them have changed
        parent.find('.selectpicker').each(function() {
            if ($(this).hasClass('topping')) {
                toppingId = $(this).val();
                //toppingId = $(this).find('option:selected').val();
            }
            if ($(this).hasClass('icing')) {
                icingId = $(this).val();
                //icingId = $(this).find('option:selected').val();
            }
            if ($(this).hasClass('filling')) {
                fillingId = $(this).val();
                //fillingId = $(this).find('option:selected').val();
            }
        });

        let button = parent.find('.btn-customize').first();
        if (flavour.IcingId != icingId || flavour.ToppingId != toppingId || flavour.FillingId != fillingId) {
            if (!button.hasClass('btn-info')) {
                button.removeClass('btn-default');
                button.addClass('btn-info');
            }
        }
        else {
            if (!button.hasClass('btn-default')) {
                button.removeClass('btn-info');
                button.addClass('btn-default');
            }
        }
    });
}

function createSpinners() {
    $(document.body).on('click', '.qty-editor-minus', function (e) {
        var editor = $(this).next('.qty-editor');
        let num: number = Number(editor.val());
        if (num > 0) {
            //invoke change because changing a value using jquery does not trigger an event
            //which is required for keeping the running total
            editor.val(num - 1).change();
        }
    });
    $(document.body).on('click', '.qty-editor-plus', function (e) {
        var editor = $(this).prev('.qty-editor');
        let num: number = Number(editor.val());
        //invoke change because changing a value using jquery does not trigger an event
        //which is required for keeping the running total
        editor.val(num + 1).change();
    });

    //When any of the flavour qtys change, sum up all the flavours and create the actual total
    $(document.body).on('input change', 'input.flavour-qty[type="number"]', function () {
        let totalSum: number = 0;
        let customSum: number = 0;
        let otherSum: number = 0;

        $('input.flavour-qty[type="number"]').each(function () {
            let editor = $(this);
            let qty: number = Number(editor.val());
            totalSum += qty;
            if (editor.hasClass('custom-flavour')) {
                customSum += qty;
            }
            if (editor.hasClass('inactive-flavour')) {
                otherSum += qty;
            }
        });

        setFlavourClasses(otherSum > 0, customSum > 0);
        $('#actualTotalQty').html('<strong>' + totalSum.toString() + '</strong>');
    })
}

function isValidPhoneNumber(value: string): boolean {
    //Because the phone field input mask prevents entering invalid characters, all we need to do
    //is make sure there are 10 or 11 characters
    if (!value) return false;
    var count = value.replace(/[^0-9]/g, "").length;

    return count == 10 || count == 11;
}