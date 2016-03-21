require('dotenv').config();
var fs = require('fs');
var request = require('request');

var data = require(process.env.JSON_SOURCE);
var Flickr = require("flickrapi"),
    flickrOptions = {
      api_key: process.env.FLICKR_KEY,
      secret: process.env.FLICKR_SECRET,
      user_id: process.env.FLICKR_USER_ID,
      access_token: process.env.FLICKR_ACCESS_TOKEN,
      access_token_secret: process.env.FLICKR_ACCESS_TOKEN_SECRET
    };
    
var flickr = null;
Flickr.authenticate(flickrOptions, function onFlickrAuthenticate(err, f) {
    if (err) {
        console.log(err);
    } else {
        flickr = f;
        parseDataGetPhotos();
    }
});

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

var parseUriAndDownload = function(uri, postId, uriIndex) {
    var filename = process.env.DOWNLOAD_DEST + '/' + postId + '_' + uriIndex;
    filename += uri.substring(uri.lastIndexOf('.'));
    
    if (uri.indexOf('staticflickr') != -1) { 
        var photoId = uri.substring(uri.lastIndexOf('/')+1, uri.indexOf('_'));
        
        console.log(photoId);
        flickr.photos.getSizes({
            api_key: process.env.FLICKR_KEY,
            authenticated: true,
            photo_id: photoId
        }, function onGetSizes(err, data) {
            if (err) {
                console.log(err);
            } else {
                
                for (var s = data.sizes.size.length-1; s>=0; s--) {
                    if (data.sizes.size[s].label === 'Original') {
                        var srcUri = data.sizes.size[s].source;
                        (function(srcUri, filename, callback) {
                            download(srcUri, filename, callback);
                        })(srcUri, filename, function(err) {
                           if (err) {
                               console.log('error downloading file: [' + filename +']');
                           } 
                        });
                        break;
                    }
                }
            }
        });
    }
};

var parseDataGetPhotos = function() {
    
    processOnePost(0);  
};

var processOnePost = function(index) {
    if (index < data.data.posts.length && index < 3) {
        
        var post = data.data.posts[index];
        
        var postId = post.id;
        
        var matches = [];
        
        matches = post.markdown.match(/\<img.+src\=(?:\"|\')(.+?)(?:\"|\')(?:.+?)\>/gim);
        
        // post.markdown.match(/\<img.+src\=(?:\"|\')(.+?)(?:\"|\')(?:.+?)\>/gim, function() {
        //    matches.push(Array.prototype.slice.call(arguments, 1, 2));
        //    //matches.push(arguments); 
        // });
        
        // var uriIndex = 0;
        // for (var m in matches) {
        //     var uriArray = matches[m];
            
        //     for (u in uriArray) {
        //         var uri = uriArray[u];
            
        //         (function(uri, postId, uriIndex) {
        //             parseUriAndDownload(uri, postId, uriIndex);
        //         })(uri, postId, uriIndex);
                
        //         uriIndex++;
        //     }
        // }
        
        index++;
        setTimeout(processOnePost, 3000, index);
    }
}