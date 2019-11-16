//Brad Traversy video helped with this
//this makes it so you must log in before you can see the dashboard
//flashes error message if you try to get there without logging in

module.exports = {
    ensureAuthenticated: function(request, response, next){
        if(request.isAuthenticated()){
            return next();
        }
        request.flash("error_msg", "Please log in to view your dashboard");
        response.redirect("/")
    }
}