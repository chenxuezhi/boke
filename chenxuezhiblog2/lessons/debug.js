module.exports = function(name){
   return function(msg){
      var debug = process.env.DEBUG;

      debug = '^'+debug.replace('*','.*');
      var regex = new RegExp(debug);
      if(regex.test(name))
        console.log(name,msg);
   }
}