// ------------------ Fill the following details -----------------------------
// Student name: Ajithraj Palanisamy
// Student email: apalanisamy3938@conestogac.on.ca

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Console } = require('console');
mongoose.connect('mongodb://localhost:27017/final8020set3', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//Create Model for Order details
const Order = mongoose.model('Order', {
    customerName: String,
    customerNumber: String,
    blizzards: Number,
    sundaes: Number,
    shakes: Number
});

//Create Model for Credentials
const User = mongoose.model('User', {
    userLogin: String,
    userPass: String
});

var myApp = express();
myApp.use(session({
    secret: 'superrandomsecret',
    resave: false,
    saveUninitialized: true
}));
myApp.use(bodyParser.urlencoded({ extended: false }));

myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');

//------------- Use this space only for your routes ---------------------------

//Decalring constants
const blizzardPrice = 7.98;
const sundaePrice = 5.99;
const shakePrice = 5.49;
const taxPercent = 0.15;

//Regex 
var phoneRegex = /^[0-9]{2}\-?[a-zA-Z]{2}\-?[0-9]{3}$/;
var nameRegex = /^[a-zA-Z ]{2,30}$/;

//Homepage
myApp.get('/', function (req, res) {
    res.render("homepage");
});

//HomePage Validations
myApp.post("/", [
    check('name', 'Name is required!').notEmpty(),
    check('name', '').custom(customNameValidation),
    check('phone', '').custom(customPhoneValidation)

], function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('homepage', {
            errors: errors.array()
        });
    }
    else {
        var name = req.body.name;
        var phone = req.body.phone;
        var blizzardQty = req.body.blizzard;
        var sundaeQty = req.body.sundae;
        var shakeQty = req.body.shake;
        var blizzardTotal = blizzardQty * blizzardPrice;
        var sundaeTotal = sundaeQty * sundaePrice;
        var shakeTotal = shakeQty * shakePrice;
        var subTotal = blizzardTotal + sundaeTotal + shakeTotal;
        var tax = subTotal * taxPercent;
        var total = subTotal + tax;

        var pageData = {
            customerName: name,
            customerNumber: phone,
            blizzards: blizzardQty,
            sundaes: sundaeQty,
            shakes: shakeQty,
            blizzardTotal: blizzardTotal,
            sundaeTotal: sundaeTotal,
            shakeTotal: shakeTotal,
            subTotal: subTotal,
            taxPercent: taxPercent * 100,
            tax: tax,
            total: total,
        };

        var myOrder = new Order(pageData);
        myOrder.save().then(() => console.log("New Order Saved"));
        res.render("homepage", pageData);
    }
}
);

//View Orders
myApp.get('/viewOrders', function (req, res) {
    if (req.session.userLoggedIn) {
        Order.find({}).exec(function (err, orderData) {
            console.log("View Order Errors :" + err);
            var orders = [];
            for (var i = 0; i < orderData.length; i++) {
                var order = orderData[i];
                var subTotal = (order.blizzards * blizzardPrice) + (order.sundaes * sundaePrice)
                    + (order.shakes * shakePrice);
                var tax = subTotal * taxPercent;
                var total = tax + subTotal;
                var pageData = {
                    customerName: order.customerName,
                    customerNumber: order.customerNumber,
                    blizzards: order.blizzards,
                    sundaes: order.sundaes,
                    shakes: order.shakes,
                    subTotal: subTotal,
                    tax: tax,
                    total: total,
                    deleteLink : "/delete/"+order._id,
                };
                orders.push(pageData); 
            }
            res.render("viewOrders", {orders: orders });
            //key value pair
        });
    } else {
        res.render("logout", { message: "User not logged In" });
    }
});

//Delete Order
myApp.get("/delete/:prod", function (req, res) {
    if (req.session.userLoggedIn) {
    var prod = req.params.prod
    Order.findOneAndDelete({ _id: prod }).exec(function (err, product) {
        console.log("Error: " + err);
        if (product) {
            res.render("delete", {
                message: "Successfully deleted the order",
            });
        } else {
            res.render("delete", {
                message: "Cannot delete the order",
            });
        }
    });
}else {
    res.render("login", { message: "Sorry, cannot login!" });
}
});

//Login
myApp.get("/login", function (req, res) {
    res.render("login", { userLoggedIn: req.session.userLoggedIn });
});

myApp.post("/login", function (req, res) {
    var user = req.body.username;
    var pass = req.body.password;

    User.findOne({ userLogin: user, userPass: pass }).exec(function (
        err,
        admin
    ) {//log any errors
        console.log("Error: " + err);
        console.log("Order: " + admin);
        if (admin) {
            //store username in session and set logged in true
            req.session.username = admin.userLogin;
            req.session.userLoggedIn = true;
            // redirect to the dashboard
            res.render("login", { message: "Logged In Successfully!" });
        } else {
            res.render("login", { message: "Sorry, cannot login!" });
        }
    });
});

//Logout
myApp.get("/logout", function (req, res) {
    if (req.session.userLoggedIn) {
        //Remove variables from session
        req.session.username = "";
        req.session.userLoggedIn = false;
        res.render("logout", { message: "Logged Out sucessfully" });
    } else {
        res.render("logout", { message: "User is not logged in" });
    }
});

//Validation for Phone no
function customPhoneValidation(value) {
    if (!checkRegex(value, phoneRegex)) {
        throw new Error('Customer Number should be in the format 12-LB-896');
    }
    return true;
}

//Validation for Name
function customNameValidation(value) {
    if (!checkRegex(value, nameRegex)) {
        throw new Error('Customer name should be in alphabets');
    }
    return true;

}

//Check RegEx method
function checkRegex(userInput, regex) {
    if (regex.test(userInput)) {
        return true;
    }
    return false;
}


//---------- Do not modify anything below this other than the port ------------
//------------------------ Setup the database ---------------------------------

myApp.get('/setup', function (req, res) {

    let userData = [{
        'userLogin': 'admin',
        'userPass': 'admin'
    }];

    User.collection.insertMany(userData);

    var firstNames = ['John ', 'Alana ', 'Jane ', 'Will ', 'Tom ', 'Leon ', 'Jack ', 'Kris ', 'Lenny ', 'Lucas '];
    var lastNames = ['May', 'Riley', 'Rees', 'Smith', 'Walker', 'Allen', 'Hill', 'Byrne', 'Murray', 'Perry'];

    let ordersData = [];

    for (i = 0; i < 10; i++) {
        let tempMemb = Math.floor((Math.random() * 100)) + '-AB' + '-' + Math.floor((Math.random() * 1000))
        let tempName = firstNames[Math.floor((Math.random() * 10))] + lastNames[Math.floor((Math.random() * 10))];
        let tempOrder = {
            customerName: tempName,
            customerNumber: tempMemb,
            blizzards: Math.floor((Math.random() * 10)),
            sundaes: Math.floor((Math.random() * 10)),
            shakes: Math.floor((Math.random() * 10))
        };
        ordersData.push(tempOrder);
    }

    Order.collection.insertMany(ordersData);
    res.send('Database setup complete. You can now proceed with your exam.');

});

//----------- Start the server -------------------

myApp.listen(8080);// change the port only if 8080 is blocked on your system
console.log('Server started at 8080 for mywebsite...');