var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
require('dotenv').config();
var NodeGeocoder = require("node-geocoder");
var options = {
    provider : 'google',
    httpAdapter :'https',
    apiKey : process.env.GEOCODER_API_KEY,
    formatter :null
};
var geocoder=NodeGeocoder(options);
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dysbtunkc', 
  api_key: 974233934498768, 
  api_secret: 'nKNWlM4zXxWK4yJdJhX-UE5QOOQ'
});

//INDEX - show all campgrounds
router.get("/", function(req, res){
    // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/index",{campgrounds:allCampgrounds});
        }
    });
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
  // get data from form and add to campgrounds array
  
   var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  var cost = req.body.cost;
  geocoder.geocode(req.body.location, function (err, data) {
      if(err || !data.length){
        
          req.flash('error','Invalid address');
          res.redirect('back');
      }
      var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
      
     
  // add cloudinary url for the image to the campground object under image property
  var name = req.body.name;
   
  
  
 
    
    var newCampground = {name: name, description: desc, cost: cost, author:author, location: location, lat: lat, lng: lng};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
    });
  });

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log(foundCampground)
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
        }else(foundCampground)
        res.render("campgrounds/edit", {campground: foundCampground});
        
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    var newData = {name: req.body.name, image: req.body.image, description: req.body.description, cost: req.body.cost, location: location, lat: lat, lng: lng};
    Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id",middleware.checkCampgroundOwnership, function(req, res){
   Campground.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/campgrounds");
      } else {
          res.redirect("/campgrounds");
      }
   });
});


module.exports = router;

