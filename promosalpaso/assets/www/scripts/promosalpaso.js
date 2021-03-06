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
        timeout: 10000,
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
                jQuery("#promolist").html(promolist);
                $.mobile.changePage(jQuery("#one"));
                $.mobile.hidePageLoadingMsg();
        },
        error: function(jqXHR, textStatus, errorThrown){
            if(_firstAttemp){
                _firstAttemp = false;
                console.log("LoadPromoList-1: ".jqXHR.responseText);
                loadPromoList();
            }
            else{
            	console.log("LoadPromoList-2: ".jqXHR.responseText);
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
        timeout: 10000,
        beforeSend: function (jqXHR, settings) {
            url = settings.url + "?" + settings.data;
        },
        success: function(data, status){
                if(data.length == 0)
                    $.mobile.changePage(jQuery("#nopromos"));
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

function getPamarByName(url, paramName){ 
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
        timeout: 10000,
        beforeSend: function (jqXHR, settings) {
            url = settings.url + "?" + settings.data;
        },
        success: function(data, status){
                loadPromoDetail(data);
                $.mobile.hidePageLoadingMsg();
                $.mobile.changePage(jQuery("#detail"));
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
    jQuery("#det-name").html(item.name);
    jQuery("#det-long_description").html(item.long_description);
    jQuery("#det-displayed_text").html(item.displayed_text);
    jQuery("#det-short_description").html(item.short_description);
    jQuery("#det-promo_value").html(formatPrice(item.promo_value));
    jQuery("#det-distance").html(item.distance);
    jQuery("#det-direccion").html(item.street + ' ' + item.number + ' - ' + item.city);
    jQuery("#det-img-comercio").attr("src",item.logo);
    if(item.branch_website != null && item.branch_website != "" )
        jQuery("#det-link").attr("href", item.website);
    else
        jQuery("#det-web").hide();
    
    if(item.phone != null && item.phone != "")
        jQuery("#det-phone").attr("onclick", "makeacall('"+item.phone+"')");
    else
        jQuery("#det-tel").hide();
    
    if(item.branch_email != null && item.branch_email != "")
        jQuery("#det-msg").attr("onclick", "sendamessage('"+item.branch_email+"')");
    else
        jQuery("#det-email").hide();
    
    if(item.path != "NOPIC")
    	jQuery("#det-img-promo").attr("src",item.path);
    else
    	jQuery("#det-img-promo").attr("src","images/photo_error.png");
    
    if(item.alert_type == "N"){
        jQuery("#det-alarma").hide();
    }
    else{
        if(item.alert_type == "Q"){
            jQuery("#det-alarm_num").html(item.quantity);
            jQuery("#det-alarm_type").html("unids");
        }
        else{
            today=new Date();
            ends = new Date(item.ends);
            var one_day = 1000*60*60*24;
            days = Math.ceil((ends.getTime()-today.getTime())/(one_day));
            jQuery("#det-alarm_num").html(days);
            jQuery("#det-alarm_type").html("días");
        } 
    }
    if(item.value_since == "1")
        jQuery("#precio_desde").show();
    else
        jQuery("#precio_desde").hide();
    if(isFavorite(item.promotion_id)){
        jQuery("#favtext").html("Quitar de Favoritos");
        jQuery("#linkFavorite").unbind("click");
        jQuery("#linkFavorite").click(function(){deleteFavorite(item.promotion_id);});
    }
    else{
        jQuery("#favtext").html("Agregar a Favoritos");
        jQuery("#linkFavorite").unbind("click");
        jQuery("#linkFavorite").click(function(){saveFavorite();});
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

// Function called when phonegap is ready
function setFullScreen() {
    //All pages at least 100% of viewport height
    var viewPortHeight = jQuery(window).height();
    var headerHeight = jQuery('div[data-role="header"]').height();
    var footerHeight = jQuery('div[data-role="footer"]').height();
    var contentHeight = viewPortHeight - headerHeight - footerHeight;

    // Set all pages with class="page-content" to be at least contentHeight
    jQuery('div[class="ui-content"]').css({'min-height': contentHeight + 'px'});
 }
 
function showProgress() {
    jQuery('body').append('<div id="progress"><img src="/css/images/ajax-loader.gif" alt="" width="16" height="11" /> Loading...</div>');
    jQuery('#progress').center();
}
function hideProgress() {
    jQuery('#progress').remove();
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
        timeout: 10000,
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
         tx.executeSql('CREATE TABLE IF NOT EXISTS province (province_id INTEGER PRIMARY KEY, name, updated DATETIME)');
         $.each(provinces, function(i,item){
            console.log("populateRegionsDB: actualizando provincia "+item.name);
            tx.executeSql('INSERT INTO province (province_id, name, updated) VALUES ('+item.province_id+',"'+item.name+'","'+item.updated+'")');
         });
     }
     if(cities != null){
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
    jQuery('#city_button').hide();
    $.mobile.changePage(jQuery("#search"));        
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
    jQuery('#state_select').empty();
    for(i=0;i<results.rows.length;i++){
        jQuery('#state_select').append('<option value="'+results.rows.item(i).province_id+'">' + results.rows.item(i).name + '</option>');
    }
    jQuery("#state_select option:first").attr('selected','selected');
    jQuery('#state_select').selectmenu("refresh");
    addCites(jQuery('#state_select').val());
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
    jQuery('#city_select').empty();
    for(i=0;i<results.rows.length;i++){
        jQuery('#city_select').append('<option value="'+results.rows.item(i).city_id+'">' + results.rows.item(i).name + '</option>');
    }
    jQuery("#city_select option:first").attr('selected','selected');     
    jQuery('#city_select').selectmenu("refresh");
    jQuery('#city_button').show();
}

//SEARCH
function doSearch(){
    var city_id = jQuery("#city_select option:selected").val();
    if(city_id != null){
        jQuery("#promolist").html("");
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
        $.mobile.changePage(jQuery("#one"));
    }
}
function errorSearchDB(err){
    console.log("error en la búsqueda de promociones por ciudad: " + err.code);
}



