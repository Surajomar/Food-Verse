const express = require('express');
const router =  express.Router();
const Blog = require('../models/Blog');
const Review = require('../models/Review');
const User = require('../models/User')
const {validate_blog , validate_review , isLoggedin,isBlogAuthor } = require('../middleware')

//  to show all items
router.get('/recipe' , async(req,res) =>{
    try{
        let {category} = req.query;
        if( category == "All" || category == undefined){
            let items = await Blog.find({});
            res.render('blogs/index' , {items});
        }
        else{
            let items = await Blog.find({category : category});
            res.render('blogs/index' ,{items});
        }
        // res.status(200).json(items);
    }
    catch(e){
        res.render('blogs/error' ,{err :e.message});
    }

})


// to render new page for add items
router.get('/recipe/new' ,isLoggedin , (req,res)=>{
    try{
        res.render('blogs/new');
    }
    catch(e){
        res.render('blogs/error' ,{err :e.message});
    }    
})

// to actually add blogs in database
router.post('/recipe/new' ,isLoggedin , async(req,res)=>{
    try{
        let {title , img ,category, desc,ingredients, lgdesc} = req.body;

            let count = req.user.post_count + 1;
            await User.findByIdAndUpdate(req.user._id , {post_count : count});
            let author = req.user._id;
            await Blog.create({title , img ,category, desc,ingredients, lgdesc, author});
            res.redirect('/recipe');
               
      
        // res.status(200).json("haa bhai");
        
    }
    catch(e){
        res.render('blogs/error' ,{err :e.message});
    }
})


// to show perticular product isLoggedin
router.get('/recipe/:id', isLoggedin, async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findById(id).populate('reviews');
        
        // Check the role of the logged-in user
        const userRole = req.user.role; // Assuming user role is stored in req.user.role
        // console.log(userRole);

        let user = await User.findById(blog.author);
        const authorName = user.username;
        let category = blog.category;
        let relatedBlogs  =   await Blog.find({category : category});
        
            res.render('blogs/show', { blog , authorName , relatedBlogs });
        
    } catch (e) {
        res.render('blogs/error', { err: e.message });
    }
});



//  for edit render edit page
router.get('/recipe/:id/edit' , isLoggedin , isBlogAuthor , async(req,res)=>{
    try {
        let{id} = req.params;
        let blog = await Blog.findById(id);
        res.render('blogs/edit' , {blog});
    }
    catch(e){
        res.render('blogs/error' ,{err :e.message});
    }

})

// to actually edited product
router.post('/recipe/:id/edit' , isLoggedin , isBlogAuthor , validate_blog ,async (req,res)=>{
    try{
        let {id} = req.params;
        let {title , img , desc, lgdesc} = req.body;
        await Blog.findByIdAndUpdate(id , {title , img , desc , lgdesc});
        res.redirect(`/recipe/${id}`);
    }
    catch(e){
        res.render('blogs/error' ,{err :e.message});
    }

})


router.post('/recipe/:id/delete' , isLoggedin , isBlogAuthor  ,async(req,res)=>{
    try {  
        let {id} = req.params;
        let blog = await Blog.findById(id);

      
        // Update the post_count
        await User.findByIdAndUpdate(blog.author, { $inc: { post_count: -1 } });
 
        // delete review
        for( let review of blog.reviews){
            await Review.findByIdAndDelete(review);
        }
        await Blog.findByIdAndDelete(id);
        res.redirect('/recipe');

    }
    catch(e){
        res.render('blogs/error' ,{err :e.message});
    }

})




router.get('/payment' , isLoggedin   ,async(req,res)=>{
    res.render('blogs/payment');

})

router.post('/payment' , isLoggedin   ,async(req,res)=>{
    let id = req.user._id;
    await User.findByIdAndUpdate(id , {role : 'premium_reader'});
    res.redirect('/blogs');
})



module.exports = router;