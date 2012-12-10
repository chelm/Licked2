var app = {
    initialize: function() {
        this.bind();
    },
    bind: function() {
        document.addEventListener('deviceready', this.deviceready, false);
    },
    deviceready: function() {
        //window.onorientationchange = function() { app.doOnOrientationChange(); };
        app.pictureSource = navigator.camera.PictureSourceType;
        app.destinationType = navigator.camera.DestinationType;

        //var deviceType = (device.platform=='iPhone' && screen.width >= 768) ? 'ipad' : 'iphone';
        if (device.platform.toLowerCase().match('ipad')){
          app.width = 768;
          app.height = 480;
        } else {
          app.width = 320;
          app.height = 480;
        }
        var canvas = document.getElementById('photo');
        canvas.style.width = app.width;
        canvas.style.width = app.height;

        app.canvas = new fabric.Canvas('photo');
        app.canvas.CANVAS_HEIGHT = app.height;
        app.canvas.CANVAS_WIDTH = app.width;
        app.bgImg = null;
        app.oImg = null;

        app.halo = 'img/halo_blur3.png';

        app.hammer = new Hammer(document.getElementById("photo"));
    
        /*alert('tyoyoy');
        $(document).on('click', function(){
          console.log('clicker');
          if (!app.canvas.getObjects()[1].left){
            alert('wtf');
            app.canvas.getObjects()[1].left = 165;
          }
        })*/

    },
    report: function(id) { 
      console.log("report:" + id );
    },
    touchMove: function(event) {
      // Prevent scrolling on this element
      event.preventDefault();
    },
    show: function(id){
      var showElem = document.querySelector('#' + id );
      showElem.className = showElem.className.split('hide').join('');
    },
    hide: function(id){
      document.querySelector('#' + id ).className += ' hide';
    },
    capturePhoto: function(){
      navigator.camera.getPicture( app.onSuccess, app.onFail, {
        quality: 10,
        targetWidth: app.width, 
        targetHeight: 480,
        saveToPhotoAlbum: true,
        correctOrientation: true,
        encodingType: Camera.EncodingType.PNG,
        destinationType: app.destinationType.FILE_URI
      });
    },
    getPhoto: function(){
      navigator.camera.getPicture( app.onSuccess, app.onFail, { 
        quality: 10,
        targetWidth: app.width, 
        targetHeight: 480,
        correctOrientation: true,
        encodingType: Camera.EncodingType.PNG,
        destinationType: app.destinationType.FILE_URI,
        sourceType: app.pictureSource.PHOTOLIBRARY
      });
    },
    onSuccess: function( imageData ) {
      if (imageData){
        app.imageData = imageData;
        app.saved_image = undefined;
        app.hide('landing');
        app.hide('info_page');
        app.show('photo_page');
        app.canvas.clear();
        window.halo = fabric.Image.fromURL(app.halo, function(img) {
          app.oImg = img.set({ left: 165, top: 85, angle: 5, cornersize: 25}).scale(0.9);
          app.canvas.add(app.oImg).renderAll();
          app.canvas.setActiveObject(app.oImg);
        });
        app.bg = fabric.Image.fromURL(imageData, function(img) {
          if (img.width > app.width){
            img.scaleToWidth(app.width);
          }
          //img.scaleToHeight(480);
          
          app.bgImg = img.set({ left:160, top: 220, active:false, selectable:false});
          app.canvas.insertAt(app.bgImg, 0);
        });
      } else {
        $('#trash').trigger('click');
      }
    },
    onFail: function(message) {
      console.log('FAIL')
      app.show('landing');
      app.hide('photo_page');
      app.hide('info_page');
      app.saved_image = undefined;
      app.canvas.clear();
    },
    addHalo: function(){
      app.canvas.deactivateAll()
      fabric.Image.fromURL(app.halo, function(img) {
        app.oImg = img.set({ left: 160, top: 125, angle: 5, cornersize: 25})
        app.canvas.add(app.oImg).renderAll();
        app.canvas.setActiveObject(app.oImg);
      });
      $('#image_bar').show();
      return true;
    },
    removeHalo: function(){
      console.log('YOOO')
      console.log(app.canvas );
      app.canvas.remove(app.canvas.getActiveObject() );
      return true;
    }, 
    capturePhotoOptions: function(){
      var as = new ActionSheet();
       as.create(null, ['New photo', 'Save photo', 'Cancel'], function(buttonValue, buttonIndex) {
        switch (arguments[1]) {
          case 0:
              app.capturePhoto();
            break;
          case 1:
              app.savePhoto(false);
              app.capturePhoto();
            break;
          
        }
      }, {destructiveButtonIndex:0, cancelButtonIndex: 1});
    },
    savedPhotoOptions: function(){
      var as = new ActionSheet();
      as.create(null, ['Load photo', 'Save photo', 'Cancel'], function( buttonValue, buttonIndex ) {
        switch (arguments[1]) {
          case 0:
              app.wipe();
              app.getPhoto();
            break;
          case 1:
              app.savePhoto(false);
              app.wipe();
              app.getPhoto();
            break;

        }
      }, {destructiveButtonIndex:0, cancelButtonIndex: 1});
    },
    share: function(){
      var as = new ActionSheet();
      
      as.create(null, ['Send email', 'Facebook', 'Save image', 'Cancel'], function(buttonValue, buttonIndex) {
        switch (arguments[1]) {
          case 0:
            app.sendEmail();
            break;
          case 1:
            app.facebookLogin();
            break;
          //case 2:
          //  app.twitterLogin();
          //  break;
          case 2:
            app.savePhoto(true);
            break;
        }
      }, {cancelButtonIndex: 3});
    },
    twitterLogin: function(){
      
    },
    facebookLogin: function() {
      if (localStorage.getItem('token')){
        cordova.exec("Prompt.show", function(){}, {title : 'Post to Facebook', okButtonTitle : "Post", cancelButtonTitle : "Cancel"});
      } else {
        cordovaRef.exec("ChildBrowserCommand.showWebPage", authorize_url);
      }
    },
    promptOkay: function(msg, email){
      if (!email) app.show('loading_page');
      //console.log( 'OKAY' );
      app.canvas.deactivateAll();
      var data = app.canvas.toDataURL( "png" ).replace('data:image/png;base64,', '');
      $.ajax({
        url: 'http://api.imgur.com/2/upload.json',
        type: 'POST',
        data: {
            type: 'base64',
            key: '724e46addb854981ea5281bb2cb251c9',
            name: 'licked.png',
            title: 'Licked By An Angel',
            caption: 'Supporting animal shelters one halo at a time.',
            image: data
        },
        dataType: 'json'
      }).success(function(data) {

        var link = data['upload']['links']['original'];
        app.saved_image = link;

        if (email){
          email(link);
        } else {
          app.fbShare(msg, link);
        }
      }).error(function(err) {
        console.log(err);
      });

    },
    promptFail: function(){
      //console.log('CANCEL');
    },
    saveFail: function(){
      console.log('SAVING IMAGE FAILED'); 
    },
    locationCatch: function(loc){
      if (loc.indexOf("https://www.facebook.com/connect/login_success.html") >= 0 || loc.indexOf("https://www.facebook.com/connect/login_success.html") > -1) {
        
        var fbCode = loc.match(/code=(.*)$/)[1];
        var url ='https://graph.facebook.com/oauth/access_token?redirect_uri='+encodeURIComponent(my_redirect_uri)+'&client_id='+my_client_id+'&client_secret='+my_secret+'&code='+fbCode; 
        var req = new XMLHttpRequest();
        req.open("POST", url, true);
        req.send({client_id: my_client_id, client_secret: my_secret, code: fbCode, redirect_uri: my_redirect_uri});
        req.onload = function(d){
          console.log('Success POST')
          localStorage.setItem('token', req.responseText.split('=')[1].replace('&expires', ''));
          cordovaRef.exec("ChildBrowserCommand.close");
          cordova.exec("Prompt.show", function(){ console.log('POST IT!!!'); }, {title : 'Post to Facebook', okButtonTitle : "Post", cancelButtonTitle : "Cancel"});
        };
      }
    },
    fbShare: function(msg, link){

      var url = 'https://graph.facebook.com/me/feed?access_token=';
        url += localStorage.getItem('token')
        url += '&picture='+link
        url += '&message='+escape(msg);
        url += '&name=Licked+By+An+Angel&description=Supporting+Shelter+Animals,+one+halo+at+a+time.&link=http://lickedbyanangel.com&caption=Licked+By+An+Angel';

      var req = new XMLHttpRequest();
      req.open("POST", url, true);
      req.send(null);
      req.onload = function(){
        app.hide('loading_page'); 
        console.log('POSTED')
        navigator.notification.alert('Posted to Facebook', null, 'Success');
      }
    },
    savePhoto: function(notify){
      app.canvas.deactivateAll();
      cordova.exec("SaveImage.saveImage", app.canvas.toDataURL("image/png").replace('data:image/png;base64,', ''));
      if (notify){
        navigator.notification.alert('Saved image to the photo library', null, 'Success');
      };
      return true;
    },
    sendEmail: function() {
      var send = function(photo){
        cordova.exec(
          null,
          null,
          "EmailComposer",
          "showEmailComposer",
          [{ body: '<a href="http://lickedbyanangel.com">Licked By An Angel</a><br /><img src="' + photo + '"/> Support Shelter Animals, one halo at a time!', bIsHTML: true}]
        );
      }
      if (!app.saved_image){
        app.promptOkay('', send);    
      } else {
        send(app.saved_image);  
      }
    },
    sendMessage: function() {
      var args;
      var sms = new SMSComposer();
      cordova.exec(null,null, 'SMSComposer','showSMSComposer',[{ body: app.imageData }]);
    },
    showInfo: function(){
      app.show('info_page');
    },
    wipe: function(){
      app.hide('info_page');
      app.canvas.clear();
      app.saved_image = undefined;
    },
    cancel: function(){
      //app.show('landing');
      //app.hide('photo_page');
      var as = new ActionSheet();

      as.create(null, ['Delete Image', 'Cancel'], function(buttonValue, buttonIndex) {
        switch (arguments[1]) {
          case 0:
              app.show('landing');
              app.hide('photo_page');
              app.canvas.clear();
            break;
        }
          //console.warn('create(), arguments=' + Array.prototype.slice.call(arguments).join(', '));
      }, {destructiveButtonIndex:0, cancelButtonIndex: 1});
    }
};

var my_client_id = "420710271316842", // YOUR APP ID
  my_secret = "0a6d1ea1a922da45cde34278222e15ea", // YOUR APP SECRET 
  my_redirect_uri = "https://www.facebook.com/connect/login_success.html", // LEAVE THIS
  my_type ="user_agent", my_display = "touch"; // LEAVE THIS

// Begin Authorization
var authorize_url = "https://graph.facebook.com/oauth/authorize?";
  authorize_url += "client_id=" + my_client_id;
  authorize_url += "&redirect_uri=" + my_redirect_uri;
  authorize_url += "&display=" + my_display;
  authorize_url += "&scope=publish_stream,offline_access";

