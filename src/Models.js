var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Order = (function () {
    function Order() {
    }
    return Order;
}());
export { Order };
var Flavour = (function () {
    function Flavour() {
    }
    return Flavour;
}());
export { Flavour };
var OrderItem = (function (_super) {
    __extends(OrderItem, _super);
    function OrderItem() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return OrderItem;
}(Flavour));
export { OrderItem };
var Payment = (function () {
    function Payment() {
    }
    return Payment;
}());
export { Payment };
var Customer = (function () {
    function Customer() {
    }
    return Customer;
}());
export { Customer };
var Address = (function () {
    function Address() {
    }
    return Address;
}());
export { Address };
var Hours = (function () {
    function Hours() {
    }
    return Hours;
}());
export { Hours };
var Closure = (function () {
    function Closure() {
    }
    return Closure;
}());
export { Closure };
var Store = (function () {
    function Store() {
    }
    return Store;
}());
export { Store };
var IdName = (function () {
    function IdName(id, name) {
        this.Id = id;
        this.Name = name;
    }
    return IdName;
}());
export { IdName };
//# sourceMappingURL=Models.js.map