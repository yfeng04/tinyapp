module.exports.getUserByEmail = function(email, database) {
    let user = Object.values(database).filter(function(user) {
       return user.email === email;
     })[0]; 
     return user;
}
