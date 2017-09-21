var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    Campground = require("./models/campground"),
    Comment = require("./models/comment"),
    seedDB = require("./seeds")
    


//connect to database
mongoose.connect("mongodb://localhost/yelp_camp");


app.use(bodyParser.urlencoded({extended:true}));

app.set("view engine", "ejs");

seedDB();

app.get("/", function(req,res){
    res.render("landing");
});

app.get("/campgrounds", function(req,res){
    Campground.find({}, function(err,allCampgrounds){
        if(err){
            console.log(err)
        }else{
             res.render("campgrounds/index",{campgrounds:allCampgrounds});
        }
    });
        
       
});

app.post("/campgrounds" , function(req,res){
    var name = req.body.name;
    var image = req.body.image;
     var desc = req.body.description;
    var newCampground = {name:name,image:image,description:desc}
    //Create new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        }else{
            //redirect back to the campgrounds page
            console.log("Back to campgrounds page");
          res.redirect("/campgrounds");  
        }
    });
    
    
    
    
});
//Show form to create new campground 
app.get("/campgrounds/new" , function(req,res){
    res.render("campgrounds/new");
});

app.get("/campgrounds/:id", function(req,res){
    //find the campground with the provided id
    Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
        if(err){
            console.log(err);
        }else{
             res.render("campgrounds/show",{campground:foundCampground});
        }
    })
    //render the show template with that campground
   
});

app.get("/campgrounds/:id/comments/new", function(req,res){
    //find campground by id
    Campground.findById(req.params.id, function(err,campground){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new", {campground:campground});
        }
    })
    
})

app.post("/campgrounds/:id/comments"),function(req,res){
    //lookup campground using ID
     Campground.findById(req.params.id, function(err,campground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        }else{
            Comment.create(req.body.comment,function(err,comment){
                if(err){
                    console.log(err);
                }else{
                    campground.comments.push(comment);
                    campground.save();
                    res.redirect("/campground/" + campground._id );
                }
            })
        }
    })
    
    //create new comment
    //connect new comment to campground
    //redirect campground show page
}

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("YelpCamp has started");
});
