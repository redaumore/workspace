function loadCities()
{
        var selectedValue = document.getElementById('province').options[document.getElementById('province').selectedIndex].value;
        var myAjax = new Ajax.Request(
        "<?=$this->url(array('controller'=>'BackendAjax','action'=>'getCities'))?>",
            {
                method:'post',
                parameters: {province_id: selectedValue},
                onSuccess: FillForm
        });
 
}

function FillForm(data)
{
        var select = document.getElementById("city");
        select.options.length = 0;
        var cities = eval('(' + data.responseText + ')');
        for (var i = 0; i < cities.items.length; i++){
            select.options[select.options.length] = new Option(cities.items[i].name, cities.items[i].city_id); 
        } 
}