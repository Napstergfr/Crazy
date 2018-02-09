    export class Order {
        Id: number;
        ForDate: string;
        RecipientName: string;
        RecipientPhone: string;
        Customer: Customer;
        PickupLocation: Store;
        DeliveryAddress: Address;
        OrderItems: OrderItem[];
        TotalQuantity: number;
        Inactive: boolean;
        Price: number;
        Payment: Payment;
        Note: string;
    }

    export class Flavour {
        //constructor() { };
        FlavourId: number;
        FlavourName: string;
        CakeId: number;
        CakeName: string;
        IcingId: number;
        IcingName: string;
        FillingId: number;
        FillingName: string;
        ToppingId: number;
        ToppingName: string;
        StyleId: number;
        StyleName: string;
        Description: string;
        Inactive: boolean;
        IsFOW: boolean;
    }

    export class OrderItem extends Flavour {
        //constructor() { super(); };
        Id: number;
        Quantity: number;
        Customized: boolean;
        Notes: string;
    }

    export class Payment {
        //constructor() {
        //    this.Id = 0;
        //    this.Date = new Date().toString();
        //}
        Id: number;
        Amount: number;
        Date: string;
        ConfirmCode: string;
    }

    export class Customer {
        Id: number;
        FirstName: string;
        LastName: string;
        Phone: string;
        Email: string;
        Address: Address;
    }

    export class Address {
        Id: number;
        Street: string;
        City: string;
        State: string;
        Zip: string;
    }

    export class Hours {
        Day: number;
        OpenTime: string;
        CloseTime: string;
    }

    export class Closure {
        Date: string;
        OpenTime: string;
        CloseTime: string;
        Closed: boolean;
    }

    export class Store {
        Id: number;
        Name: string;
        Hours: Hours[];
        Closures: Closure[];
    }

    export class IdName {
        constructor(id: number, name: string) {
            this.Id = id;
            this.Name = name;
        }
        Id: number;
        Name: string;
    }
