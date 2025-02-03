const express = require('express'); 
const connectDB = require('./config/db');
const path = require('path');
const cookieParser = require('cookie-parser'); 
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoDbStore = require("connect-mongodb-session")(session); // Import and configure mongoDbStore
const handlebar          = require("express-handlebars")       
const cors = require('cors'); // To handle CORS issues in development
const { createSuperAdmin } = require('./controller/AdminController');
createSuperAdmin();
require('dotenv').config();

const app = express();

const user = require("./routes/user");
const admin = require("./routes/admin");

// Middleware
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form submissions
app.use(cookieParser()); // Use cookie-parser to handle cookies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
// In app.js
global.appRoot = __dirname;

// Session setup
const store = new mongoDbStore({
    uri: process.env.MONGO_URI, // Pass the MongoDB Atlas URI directly
    collection: 'sessions', // Name of the session collection in MongoDB
});

app.use(session({
    secret: "gjhghj",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 600000 * 24 },
    store: store
}));

app.use("/", user);
app.use("/admin", admin);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const hbs = require('hbs'); 
const moment = require('moment');  // Import moment.js

// Register the moment helper
hbs.registerHelper('moment', function(date, format) {
    return moment(date).format(format);
});
hbs.registerHelper('statusBadgeClass', function(status) {
    switch(status) {
        case 'Delivered': return 'status-delivered';
        case 'In Transit': return 'status-in-transit';
        case 'Failed Delivery':
        case 'Cancelled': return 'status-exception';
        default: return 'status-in-transit';
    }
});
hbs.registerHelper('last', function(array) {
    return array[array.length - 1];
});

// Register the custom helper for less than or equal
hbs.registerHelper('lessThanOrEqual', function(a, b) {
    return a <= b;
});
// In server.js
hbs.registerHelper('formatDate', function(dateString) {
    try {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date)) return 'Invalid Date';
        
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Date Error';
    }
});
const Handlebars = require('handlebars');

Handlebars.registerHelper('formatDate', function(date) {
    return new Date(date).toLocaleString();
});
const { parseISO, isValid, format } = require('date-fns');

const hbsInstance = hbs.create({
  helpers: {
    formatDate: function (date) {
      try {
        // Parse the date string
        const parsedDate = parseISO(date);

        // Check if the parsed date is valid
        if (!isValid(parsedDate)) {
          throw new Error("Invalid date format");
        }

        // Format the date as "05 Jun 2019"
        return format(parsedDate, 'dd MMM yyyy');
      } catch (error) {
        console.error("Date Formatting Error:", error);
        return 'Invalid Date'; // Fallback for invalid dates
      }
    },
    json: function (context) {
      return JSON.stringify(context, null, 2); // Pretty-print JSON for debugging
    }
  }
});


hbs.registerHelper('formatDate', function(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});
hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
});



// Helper to format time
hbs.registerHelper('formatTime', function(date) {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
});

// Helper to get appropriate icon based on status
hbs.registerHelper('getStatusIcon', function(status) {
    const icons = {
        'Created': 'bi-box-seam',
        'Picked Up': 'bi-truck',
        'In Transit': 'bi-truck',
        'Out for Delivery': 'bi-bicycle',
        'Delivered': 'bi-house-check',
        'Failed Delivery': 'bi-x-circle',
        'Cancelled': 'bi-x-octagon'
    };
    return icons[status] || 'bi-circle';
});
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Access the application at http://localhost:${PORT}`);
});