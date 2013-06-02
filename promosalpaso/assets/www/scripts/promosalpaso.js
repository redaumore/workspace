/*
  Variables guardadas en Session:
    -activePromotion
    -lastSearch
*/

/*RAMOS MEJIA
var _lat = "-34.6463";
var _lng = "-58.5648";
*/


/*SAN JUSTO*/
//var _lat = "-34.681774410598"; //"-34.6463";
//var _lng = "-58.561710095183" ; //"-58.5648";


/* CASANOVA */
  //var _lat = "-34,707320691758";
  //var _lng = "-58,583339428671";
var _lat;
var _lng;
var _promo_lat;
var _promo_lng;
var _baseServUri = _baseUri + "services/";
var _baseAjaxUri = _baseUri + "Backendajax/";
var _activePromo;
var _firstAttemp = true;
var _firstAttempFav = true;
var _inFavorites = false;
var _last_update;

$(document).ready(function(){
	if(jQuery.browser.mobile){
        $.mobile.defaultPageTransition = 'none';
        _last_update = window.localStorage.getItem("last_update");    
        if(_last_update == null)
            setLastUpdate(new Date(0));
        console.log("Ultima actualización: "+_last_update);    
        console.log("Actualizando ciudades...");
        getRegionsUpdate();
        navigator.geolocation.getCurrentPosition(onSuccess, 
    		    onError_highAccuracy, 
    		    {maximumAge:600000, timeout:5000, enableHighAccuracy: true});
        setLastUpdate(new Date());
    }
});

$(document).bind("mobileinit", function(){
	$.mobile.defaultPageTransition = 'none';
});

function refreshPromoList(){
	if(_lat == null || _lng == null){
		showMessage('No se encontraron promos. Intenta nuestra búsqueda manual.', 'Info', 'Ok');
        gotoSearch();
        return;
	}
	showMessage(_lat, 'Info', 'Ok');
	loadPromoList(); 
}

function setLastUpdate(timestamp){
    _last_update = timestamp.toISOString();
    _last_update = _last_update.replace("T"," ");
    _last_update = _last_update.replace("Z","");    
}

function onBackKeyDown(){
    if(_inFavorites){
        _inFavorites = false;
        loadPromoList();
    }
            
}

function loadPromoList(){
    $.ajax({
        url: _baseServUri + 'getpromolist',
        dataType: 'jsonp',
        data: {"lat": _lat,
               "lng": _lng},
        jsonp: 'jsoncallback',
        contentType: "application/json; charset=utf-8",
        timeout: 5000,
        beforeSend: function (jqXHR, settings) {
            console.log(settings.url);
        },
        success: function(data, status){
                console.log("loadPromoList: llamada a servicio exitosa");
                window.localStorage.setItem("lastSearch", JSON.stringify(data));
                if(data.length == 0){
                    if($.mobile.activePage == "one"){
                        showMessage('No se encontraron promos. Intenta nuestra búsqueda manual.', 'Info', 'Ok');
                        gotoSearch();
                    }
                    else
                    	if($.mobile.activePage == "search"){
	                        showMessage('No se encontraron promos activas para esta ciudad.', 'Info', 'Ok');
	                        return;
                    	}
                }
                var promolist = "";
                $.each(data, function(i,item){
                    promolist += getPromoRecord(item);
                });
                $("#promolist").html(promolist);
                $.mobile.changePage($("#one"));
                $.mobile.hidePageLoadingMsg();
        },
        error: function(jqXHR, textStatus, errorThrown){
            if(_firstAttemp){
                _firstAttemp = false;
                console.log("LoadPromoList-1: ".textStatus);
                loadPromoList();
            }
            else{
            	console.log("LoadPromoList-2: ".textStatus);
	            showMessage('Hubo un error recuperando las promociones. Por favor intentalo más tarde...', 'Error', 'Ok');
	            $.mobile.hidePageLoadingMsg();
            }
        }
    });
}

function loadPromoListByIds(ids){
	$.ajax({
        url: _baseServUri + 'getpromolistbyids',
        dataType: 'jsonp',
        data: {"ids": ids, 
               "lat": _lat, 
               "lng": _lng},
        jsonp: 'jsoncallback',
        contentType: "application/json; charset=utf-8",
        timeout: 5000,
        beforeSend: function (jqXHR, settings) {
            url = settings.url + "?" + settings.data;
        },
        success: function(data, status){
                if(data.length == 0)
                    $.mobile.changePage($("#nopromos"));
                document.getElementById("promolist").innerHTML = "";                        
                $.each(data, function(i,item){
                    document.getElementById("promolist").innerHTML += getPromoRecord(item);
                });
        },
        error: function(jqXHR, textStatus, errorThrown){
            if(_firstAttempFav){
                _firstAttempFav = false;
                loadPromoListByIds(ids);
            }
            else{
                showMessage('Hubo un error recuperando las favoritas. Por favor intentalo más tarde...', 'Error', 'Ok');
            }
        }
    });
}

function getPromoRecord(promo){
    var liString = getLiString();
    liString = liString.replace("#ID#", promo.promotion_id);
    if(promo.path != "NOPIC")
    	liString = liString.replace("#IMAGE#", promo.path);
    else
    	liString = liString.replace("#IMAGE#", "images/photo_error.png");
    liString = liString.replace("#COMERCIO#", promo.name);
    liString = liString.replace("#DESCRIPCION#", promo.short_description);        
    liString = liString.replace("#PROMO#", promo.displayed_text);
    liString = liString.replace("#PRECIO_DESDE#", (promo.value_since == 1)?"inline":"none");
    liString = liString.replace("#PRECIO#", formatPrice(promo.promo_value));
    liString = liString.replace("#DISTANCIA#", promo.distance);
    return liString;
}

function gotoPromo(id_promotion){
	$.mobile.showPageLoadingMsg('a', "Cargando promo...", false);
    window.localStorage.setItem("activePromotion", id_promotion);
    callPromoDetail(id_promotion);
}

function getParamByName(url, paramName){ 
    var strGET = url.substr(url.indexOf('?')+1,url.length - url.indexOf('?')); 
    var arrGET = strGET.split("&"); 
    var paramValue = '';
    for(i=0;i<arrGET.length;i++){ 
          var aux = arrGET[i].split("="); 
          if (aux[0] == paramName){
                paramValue = aux[1];
          }
    } 
    return paramValue;
}

function callPromoDetail(promotion_id){
    var promotion_detail;
    $.ajax({
        url: _baseServUri + 'getpromodetail',
        dataType: 'jsonp',
        data: {"lat": _lat,
               "lng": _lng, 
               "promoid": promotion_id},
        jsonp: 'jsoncallback',
        contentType: "application/json; charset=utf-8",
        timeout: 5000,
        beforeSend: function (jqXHR, settings) {
            url = settings.url + "?" + settings.data;
        },
        success: function(data, status){
                loadPromoDetail(data);
                $.mobile.hidePageLoadingMsg();
                $.mobile.changePage($("#detail"));
        },
        error: function(jqXHR, textStatus, errorThrown){
            showMessage(
            'Hubo un error accediendo a los datos de la Promo. Por favor intenta más tarde...',
            'Error',
            'OK'
            );
            $.mobile.hidePageLoadingMsg();
        }
    });
    return promotion_detail;
}

function loadPromoDetail(item){
    $("#det-name").html(item.name);
    $("#det-long_description").html(item.long_description);
    $("#det-displayed_text").html(item.displayed_text);
    $("#det-short_description").html(item.short_description);
    $("#det-promo_value").html(formatPrice(item.promo_value));
    $("#det-distance").html(item.distance);
    $("#det-direccion").html(item.street + ' ' + item.number + ' - ' + item.city);
    $("#det-img-comercio").attr("src",item.logo);
    if(item.branch_website != null && item.branch_website != "" )
        $("#det-link").attr("href", item.website);
    else
        $("#det-web").hide();
    
    if(item.phone != null && item.phone != "")
        $("#det-phone").attr("onclick", "makeacall('"+item.phone+"')");
    else
        $("#det-tel").hide();
    
    if(item.branch_email != null && item.branch_email != "")
        $("#det-msg").attr("onclick", "sendamessage('"+item.branch_email+"')");
    else
        $("#det-email").hide();
    
    if(item.path != "NOPIC")
    	$("#det-img-promo").attr("src",item.path);
    else
    	$("#det-img-promo").attr("src","images/photo_error.png");
    
    if(item.alert_type == "N"){
        $("#det-alarma").hide();
    }
    else{
        if(item.alert_type == "Q"){
            $("#det-alarm_num").html(item.quantity);
            $("#det-alarm_type").html("unids");
        }
        else{
            today=new Date();
            ends = new Date(item.ends);
            var one_day = 1000*60*60*24;
            days = Math.ceil((ends.getTime()-today.getTime())/(one_day));
            $("#det-alarm_num").html(days);
            $("#det-alarm_type").html("días");
        } 
    }
    if(item.value_since == "1")
        $("#precio_desde").show();
    else
        $("#precio_desde").hide();
    if(isFavorite(item.promotion_id)){
        $("#favtext").html("Quitar de Favoritos");
        $("#linkFavorite").unbind("click");
        $("#linkFavorite").click(function(){deleteFavorite(item.promotion_id);});
    }
    else{
        $("#favtext").html("Agregar a Favoritos");
        $("#linkFavorite").unbind("click");
        $("#linkFavorite").click(function(){saveFavorite();});
    }
    _promo_lat = item.latitude;
    _promo_lng = item.longitude;
}

function saveFavorite(){
    var located = false;
    var favoritos = window.localStorage.getItem("favoritos");
    var activePromo = window.localStorage.getItem("activePromotion");
    if (favoritos != null){
        var arrFav = favoritos.split(",");
        for(var i = 0; i < arrFav.length; i++){
            if(arrFav[i] == activePromo)
                located = true;
        }
        if(!located)
            favoritos = favoritos + activePromo + ",";
    }
    else{
        favoritos = activePromo + ",";
    }
    window.localStorage.setItem("favoritos", favoritos);
    showMessage("La promo se ha agregado a tus favoritos.", "Info", "Ok");    
}

function deleteFavorite(id){
    var fav = window.localStorage.getItem("favoritos");
    if(fav == null)
        return;
    arrFav = fav.split(",");
    for(var i=0; i<arrFav.length; i++){
        if(arrFav[i] = id)
            arrFav.splice(i, 1);
    }
    if(arrFav.toString()=="")
        window.localStorage.removeItem("favoritos");
    else
        window.localStorage.setItem("favoritos", arrFav.toString());
    showMessage("La promo se ha eliminado de tus favoritos.", "Info", "Ok");
}

function isFavorite(id){
    var fav = window.localStorage.getItem("favoritos");
    if(fav == null)
        return false;
    arrFav = fav.split(",");
    for(var i=0; i<arrFav.length; i++){
        if(arrFav[i] == id)
            return true;
    }
    return false;
}

function gotoFavoritos(){
    var favoritos = window.localStorage.getItem("favoritos");
    if(favoritos != null)
        if(favoritos != ""){
            _inFavorites = true;
            loadPromoListByIds(favoritos.substring(0, favoritos.lastIndexOf(",")));
            return;
        }
    showMessage('No tienes favoritos.', 'Info', 'Ok');        
}

function showMessage(message, title, button){
	$.mobile.showPageLoadingMsg('a', message, true);
	setTimeout( function() { $.mobile.hidePageLoadingMsg(); }, 3000 );
    /*
	if(navigator.notification == null)
        alert(message);
    else
        navigator.notification.alert(message, null, title, button);
    */        
}
// Function called when phonegap is ready
function setFullScreen() {
    //All pages at least 100% of viewport height
    var viewPortHeight = $(window).height();
    var headerHeight = $('div[data-role="header"]').height();
    var footerHeight = $('div[data-role="footer"]').height();
    var contentHeight = viewPortHeight - headerHeight - footerHeight;

    // Set all pages with class="page-content" to be at least contentHeight
    $('div[class="ui-content"]').css({'min-height': contentHeight + 'px'});
 }
 
function showProgress() {
    $('body').append('<div id="progress"><img src="/css/images/ajax-loader.gif" alt="" width="16" height="11" /> Loading...</div>');
    $('#progress').center();
}
function hideProgress() {
    $('#progress').remove();
}
jQuery.fn.center = function () {
    this.css("position", "absolute");
    this.css("top", ($(window).height() - this.height()) / 2 + $(window).scrollTop() + "px");
    this.css("left", ($(window).width() - this.width()) / 2 + $(window).scrollLeft() + "px");
    return this;
}

function getLiString(){
var liString = new String();

liString = '<li data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="b" class="ui-btn ui-li-has-arrow ui-li ui-li-has-thumb ui-btn-up-c ui-li-static"  style="padding: 0px;">';
liString += '   <div class="ui-btn-inner ui-li ui-li-static ui-btn-up-b" style="padding: 0px;">';
liString += '       <div class="ui-btn-text registro">';
liString += '           <a href="#" data-transition="slide" onclick="gotoPromo(#ID#);">'; //<a href="#ID#">';
liString += '               <table class="aviso">';
liString += '                  <tr>';
liString += '                     <td class="image" style="width: 50px;">';
liString += '                        <img src="#IMAGE#" class="shadow image">';
liString += '                     </td>';
liString += '                     <td style="border-right: solid 1px #9CAAC6;">';
liString += '                        <p class="comercio ui-li-desc">#COMERCIO#</p>';
liString += '                        <p class="descripcion ui-li-desc">#DESCRIPCION#</p>';
liString += '                        <p class="promo ui-li-desc">#PROMO#</p>';
liString += '                     </td>';
liString += '                     <td style="width: 30px;">';
liString += '                        <div style="text-align: center;">';
liString += '                            <div class="desde" style="display: #PRECIO_DESDE#;">desde</div>';
liString += '                            <div style="border-bottom: solid 1px #9CAAC6;"><span class="precio">#PRECIO#</span></div>';
liString += '                            <div style="vertical-align: middle; text-align: center"><span class="distancia">#DISTANCIA#</span></div>';
liString += '                        </div>';
liString += '                     </td>';
liString += '                     <td class="arrow-r ui-icon-shadow">&nbsp;</td>';
liString += '                  </tr>';
liString += '               </table>';
liString += '            </a></div></div></li>';

    return liString;
}

function formatPrice(price){
    var formatedPrice = "";
    point = price.indexOf(".00");
    if(point == -1)
        formatedPrice = price.substring(0, price.indexOf(".")) + price.substring(price.indexOf(".")+1, price.length).sup();
    else
        formatedPrice = price.substring(0, price.indexOf("."));
    
    return formatedPrice;
}

//onSuccess Callback
//This method accepts a `Position` object, which contains
//the current GPS coordinates
var onSuccess = function(position) {
    _lat = position.coords.latitude;
	_lng = position.coords.longitude;
    console.log("onSuccess");
};

function onError_highAccuracy(error) {
    var msg = "";
    //if(error.code == 2)
        msg = 'No se pudo obtener datos del GPS. Se localizará por 3G, por lo que la localización puede presentar un desvío de 150 mts aproximadamente.';
        // Attempt to get GPS loc timed out after 5 seconds, 
        // try low accuracy location
        showMessage(msg, 'GPS', 'OK');
        navigator.geolocation.getCurrentPosition(
                   onSuccess, 
                   onError,
                   {maximumAge:600000, timeout:10000, enableHighAccuracy: false});
        return;
    //}
}

//onError Callback receives a PositionError object
function onError(error) {
    msg = 'No se pudo obtener datos del localización. Te sugerimos realizar una búsqueda por dirección/localidad. (SJ)';
    showMessage(msg, 'Info', 'OK');
    _lat = "-34.681774410598"; 
    _lng = "-58.561710095183" ;
    //gotoSearch();
    /*SAN JUSTO*/
	//_lat = "-34.681774410598"; 
	//_lng = "-58.561710095183" ;
    //loadPromoList();
}

//CONFIG
function getRegionsUpdate(){
    console.log("getRegionsUpdate-last_update: "+_last_update);
    $.ajax({
        url: _baseServUri + 'getregions',
        dataType: 'jsonp',
        data: {"lastupdate": _last_update},
        jsonp: 'jsoncallback',
        contentType: "application/json; charset=utf-8",
        timeout: 5000,
        beforeSend: function (jqXHR, settings) {
            console.log(settings.url);
        },
        success: function(data, status){
                console.log("getRegionUpdate: llamada a servicio exitosa");
                if(data == null){
                    console.log("No se actualizaron regiones");
                    return;
                }
                addRegions(data.province, data.city);    
        },
        error: function(jqXHR, textStatus, errorThrown){
            console.log("Error getRegionUpdate: " + textStatus);
            showMessage('Hubo un error actualizando las ciudades', 'Error', 'Ok');
        }
    });
}    
function addRegions(provinces, cities){
    var db = window.openDatabase("promosalpaso", "1.0", "Promos al Paso", 300000);
    db.transaction(function(tx){populateRegionsDB(tx, provinces, cities)}, errorCB, successCB);
}
function populateRegionsDB(tx, provinces, cities) {
    if(provinces != null ){
         tx.executeSql('DROP TABLE IF EXISTS province');
         tx.executeSql('CREATE TABLE IF NOT EXISTS province (province_id INTEGER PRIMARY KEY, name, updated DATETIME)');
         $.each(provinces, function(i,item){
            console.log("populateRegionsDB: actualizando provincia "+item.name);
            tx.executeSql('INSERT INTO province (province_id, name, updated) VALUES ('+item.province_id+',"'+item.name+'","'+item.updated+'")');
         });
     }
     if(cities != null){
         tx.executeSql('DROP TABLE IF EXISTS city');
         tx.executeSql('CREATE TABLE IF NOT EXISTS city (city_id INTEGER PRIMARY KEY, name, latitude, longitude, province_id INTEGER, updated DATETIME)');
         $.each(cities, function(i,item){
            console.log("populateRegionsDB: actualizando ciudad "+item.name);
            console.log('INSERT INTO city (city_id, name, latitude, longitude, province_id, updated) VALUES ('+item.city_id+',"'+item.name+'","'+item.latitude+'","'+item.longitude+'",'+item.province_id+',"'+item.updated+'")');
            tx.executeSql('INSERT INTO city (city_id, name, latitude, longitude, province_id, updated) VALUES ('+item.city_id+',"'+item.name+'","'+item.latitude+'","'+item.longitude+'",'+item.province_id+',"'+item.updated+'")');
         });
     }
}
function errorCB(err) {
    console.log("errorCB: "+err.message+". Code: "+err.code);
    alert("Error actualizando ciudades: "+err.code);
}
function successCB(){
	window.localStorage.setItem("last_update", _last_update);
}
function gotoSearch(){
    var db = window.openDatabase("promosalpaso", "1.0", "Promos al Paso", 200000);
    db.transaction(populateProvinceDDL, errorProvinceDDL, successProvinceDDL);
    $('#city_button').hide();
    $.mobile.changePage($("#search"));        
}
function populateProvinceDDL(tx){
    tx.executeSql('SELECT province_id, name FROM province ORDER BY name', [], queryProvinceSuccess, errorCB);
}
function successProvinceDDL(){
    
}
function errorProvinceDDL(err) {
        console.log("errorProvinceDDL: "+err.message+". Code: "+err.code);
    }
function queryProvinceSuccess(tx, results){
    $('#state_select').empty();
    for(i=0;i<results.rows.length;i++){
        $('#state_select').append('<option value="'+results.rows.item(i).province_id+'">' + results.rows.item(i).name + '</option>');
    }
    $("#state_select option:first").attr('selected','selected');
    $('#state_select').selectmenu("refresh");
    addCites($('#state_select').val());
}
function addCites(province_id) {
    var db = window.openDatabase("promosalpaso", "1.0", "Promos al Paso", 200000);
    db.transaction(function(tx){populateCityDDL(tx, province_id)}, errorCityDDL, successCityDDL);
}
function populateCityDDL(tx, province_id){
    tx.executeSql('SELECT city_id, name FROM city WHERE province_id = '+province_id+' ORDER BY name', [], queryCitySuccess, errorCB);
}
function successCityDDL(){
    
}
function errorCityDDL(err) {
        console.log("Error City SQL: "+err.code);
    }
function queryCitySuccess(tx, results){
    $('#city_select').empty();
    for(i=0;i<results.rows.length;i++){
        $('#city_select').append('<option value="'+results.rows.item(i).city_id+'">' + results.rows.item(i).name + '</option>');
    }
    $("#city_select option:first").attr('selected','selected');     
    $('#city_select').selectmenu("refresh");
    $('#city_button').show();
}

//SEARCH
function doSearch(){
    var city_id = $("#city_select option:selected").val();
    if(city_id != null){
        $("#promolist").html("");
        var db = window.openDatabase("promosalpaso", "1.0", "Promos al Paso", 200000);
        db.transaction(function(tx){querySearchDB(tx, city_id)}, errorSearchDB);    
    }
    else{
        showMessage("No hay ciudad seleccionada.", "Info", "Ok");
    }
}
function querySearchDB(tx, city_id) {
        tx.executeSql('SELECT * FROM city WHERE city_id = ' + city_id, [], querySearchSuccess, errorSearchDB);
}
function querySearchSuccess(tx, results) {
    len = results.rows.length;
    if(len = 1){
        _lat = results.rows.item(0).latitude;
        _lng = results.rows.item(0).longitude;
        loadPromoList();
        $.mobile.changePage($("#one"));
    }
}
function errorSearchDB(err){
    console.log("error en la búsqueda de promociones por ciudad: " + err.code);
}



$('#state_select').live("change blur", function() {
    var selectedState = $(this).val();
    addCites(selectedState);
    if ($('#city_select option').size() == 0) {
        $('#city_select').append('<option value="nocity">No se encontraron ciudades</option>');
    }
    event.preventDefault();
});

$('#a_search_button').live("click", function() {
    event.preventDefault();
    doSearch();
});

$(document).delegate( "#page-map", "pagebeforeshow", function(event){
    initialize();
    var _width = $(window).width();
    var _height = $(window).height();
    $("#map_canvas").css({height:_height});
    $("#map_canvas").css({width:_width});
    calcRoute();
});

(function(a){jQuery.browser.mobile=/android.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))})(navigator.userAgent||navigator.vendor||window.opera);
    