(function () {
	
	/***********************************************************************
	The following code initializes Prayertime Plugin in the Global Object
	
	START Global Initialization
	***********************************************************************/
    window.masjidData = {
            ptplugin : {}
        };

    var pp = window.masjidData.ptplugin;    
    pp.previousPrayer = "";
    pp.nextPrayer = "";	
    
    pp.nextRunTimeInMilliSec=60000;
    //This represents the pt data for one or whole month
    pp.ptCache = ""
    //the current data that is being shown in the grid display
    pp.gridData = "";
    pp.gridDate = null;
    
    pp.gridHeader = ["header","fajar","sunrise","dhuhr","asr","maghrib","isha","jumah1","jumah2"];
    
    //var dataRefreshFrequency = arguments[0];    
	
	var now, nowWithoutTimeStr, clientOffset, dayOfTheWeek, today, tomorrow, tomorrowWithoutTimeStr;
	
	/***********************************************************************	
	END Global Initialization
	***********************************************************************/			
	
    function Slider(cacheType, debugMode){
		pp.logging = debugMode;
        loadCache(cacheType);
    }	
	
	/*
	This is the first method that is run. loadCache method initialzies the cache
	by getting the data from the server
	*/
	function loadCache(cacheType){
		var url = "http://www.yahibaba.com/madmin/prayerTimes/" + cacheType;
		$.getJSON(url, function(data){
			pp.ptCache = data;			
			console.log("Cache has been initialized.");
			run();
		});		
	}	
	
	/*
	This method is called after the cache has been initialized
	*/
    var run = function(){		
        init();
        moveSlider();
    }		
	
	/*
	
	*/
	function init(){
        		
        //initialize cache
        //pp.ptCache = JSON.parse($("#prayerTimesData").val());
		//alert(pp.ptCache[0].date);
        
        clientOffset = -6;
        
        //initialize today and tomorrow date variables
        now = clientDate(new Date(), clientOffset);              
        nowWithoutTimeStr = (now.getMonth() + 1)+"/"+now.getDate()+"/"+now.getFullYear();        
        today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);
        tomorrowWithoutTimeStr = (tomorrow.getMonth() + 1)+"/"+tomorrow.getDate()+"/"+tomorrow.getFullYear();

        //get today's and tomorrow's grid data from cache
        var todayData, tomorrowData;
        for(var i=0; i<pp.ptCache.length; i++){
        	if(nowWithoutTimeStr === pp.ptCache[i].date){
        		todayData = pp.ptCache[i];
        	} else if(tomorrowWithoutTimeStr === pp.ptCache[i].date){
        		tomorrowData = pp.ptCache[i];
        	}
        }
		
		/*
		Next we need to establish if which days data will the grid display. If the current day's 
		last prayer is done (isha prayer), then the grid will display next days data. 
		*/
		
        
        var ishaDate=null;
        
        //This var needs to be initialized in case todayData is not found to some value lesser than now.
        var endOfCurrentDay=new Date(nowWithoutTimeStr);
        
        //This condition can happen for DAILY schedule since only one days data is available.
        if(todayData !== undefined){
        	//get isha prayers date and add buffer time to it
        	ishaDate = new Date(nowWithoutTimeStr + " " + todayData["ishaIqamaTime"]);
        	endOfCurrentDay = new Date(ishaDate.getTime() + (todayData["ishaBufferTime"] * 60 * 1000));
        }

        //if ISHA prayer is done then gridDate is next day if not then it is the current day
        if(now.getTime() < endOfCurrentDay.getTime()){	
        	pp.gridDate = now;
        	pp.gridDateWithoutTimeStr = nowWithoutTimeStr;
        	pp.gridData = todayData;
        } else {
        	pp.gridDate = tomorrow;
        	pp.gridDateWithoutTimeStr = (tomorrow.getMonth() + 1)+"/"+tomorrow.getDate()+"/"+tomorrow.getFullYear();
        	pp.gridData = tomorrowData;
        }		        		
        log("The grid date is: "+pp.gridDate);
		
		populateGrid();
        
        //basing on the grid date initialize the prayerlist
        if(pp.gridDate.getDay() === 5){
            pp.prayerList = ["fajar","jumah1","jumah2", "asr","maghrib","isha"];            
        } else {
            pp.prayerList = ["fajar","dhuhr", "asr","maghrib","isha"];
        }
             
	}
	
	function populateGrid(){
		
		//Load prayer times
		var spans = $( "#prayertimegrid1 tr:eq(1) span" );
		$(spans[1]).text(pp.gridData.fajarTime);
		$(spans[2]).text(pp.gridData.sunriseTime);
		$(spans[3]).text(pp.gridData.dhuhrTime);
		$(spans[4]).text(pp.gridData.asrTime);
		$(spans[5]).text(pp.gridData.maghribTime);
		$(spans[6]).text(pp.gridData.ishaTime);
		$(spans[7]).text(pp.gridData.jumah1Time);
		$(spans[8]).text(pp.gridData.jumah2Time);
		
		//Load iqama times
		spans = $( "#prayertimegrid1 tr:eq(2) span" );
		$(spans[1]).text(pp.gridData.fajarIqamaTime);
		//$(spans[2]).text(pp.gridData.sunriseTime);
		$(spans[3]).text(pp.gridData.dhuhrIqamaTime);
		$(spans[4]).text(pp.gridData.asrIqamaTime);
		$(spans[5]).text(pp.gridData.maghribIqamaTime);
		$(spans[6]).text(pp.gridData.ishaIqamaTime);
		$(spans[7]).text(pp.gridData.jumah1IqamaTime);
		$(spans[8]).text(pp.gridData.jumah1IqamaTime);		
		
		log("Done populating the data grid");
		
		$( "#prayertimegrid2 tr:eq(1) td:eq(0) span" ).text(pp.gridData.fajarTime);
		
		
	}	
	
	/*
	
	*/
	function moveSlider(){
		
		if(pp.previousPrayer === "isha"){
			window.location.reload(true);
		}
		
		//findNextPrayer();		
		testNextPrayer();
		
		var ptindex = pp.gridHeader.indexOf(pp.nextPrayer);

        $( "#prayertimegrid1 tr" ).each(function(index, element){
        	var tds = $(this).children();
        	tds.removeClass("nextprayer");
        	$(tds[ptindex]).addClass("nextprayer");
        })
        
        $( "#prayertimegrid2 tr" ).children().removeClass("nextprayer")
        $( "#prayertimegrid2 tr:eq("+ptindex+")" ).children().addClass("nextprayer")
		
		log("Done setting the slider");
        
        //var counterDate = new Date(pp.nextPrayerIqamaDate.getFullYear(), pp.nextPrayerIqamaDate.getMonth(), pp.nextPrayerIqamaDate.getDate());
        //$('#countdown-ex3').countdown({until: pp.nextPrayerIqamaDate});
        
		log("Next run is in : "+pp.nextRunTimeInMilliSec/(1000)+" seconds");
        setTimeout(moveSlider, pp.nextRunTimeInMilliSec);        
	}
		
	function findNextPrayer(){
		now = clientDate(new Date(), clientOffset);
        for(var i=0; i < pp.prayerList.length; i++){
        	var prayerNameProp = pp.prayerList[i]+"IqamaTime";
            var pDate = new Date(pp.gridDateWithoutTimeStr + " " + pp.gridData[prayerNameProp]);
            var bufferProp = pp.gridData[pp.prayerList[i]+"BufferTime"];
            var startTime = new Date(pDate.getTime() + (bufferProp * 60 * 1000));

            if(now.getTime() < startTime.getTime()){
            	pp.nextPrayerIqamaDate=pDate;
                pp.previousPrayer = pp.nextPrayer;
                pp.nextPrayer = pp.prayerList[i];                        
                pp.nextRunTimeInMilliSec = startTime.getTime() - now.getTime();
                break;
            }

        }
        
        if(pp.nextPrayer === "" || pp.nextPrayer === null || pp.nextPrayer === undefined){
        	window.location.reload();
        }
        
        log("The next prayer is: "+pp.nextPrayer);    
		
	}
	

    
    pp.slider = Slider;	
	
	// ==========================Helper functions Start===========================
	
    //Utility function Converts any date to a date basing on client timezone
    function clientDate(date, offset) {

        // create Date object for current location
        //d = new Date(dateStr);

        // convert to msec, add local time zone offset, get UTC time in msec
        var utc = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);

        // create new Date object for different city, using supplied offset
        nd = new Date(utc + (3600000*offset));
        return nd;
    }	
    
    function log(msg){
        if(pp.logging) {
            console.log(msg);
        }
    }    
	
	function testNextPrayer(){
		pp.previousPrayer = pp.nextPrayer;
		if(pp.nextPrayer == "isha") {
			window.location.reload();
			return;
		}
		var index = pp.prayerList.indexOf(pp.nextPrayer)+1;
		
		//pp.nextPrayerIqamaDate=pDate;
		pp.previousPrayer = pp.nextPrayer;
		//pp.nextPrayer = pp.prayerList[i];                        
		pp.nextRunTimeInMilliSec = 10 * 1000;		
		
		pp.nextPrayer = pp.prayerList[index];
		log("The next prayer is: "+pp.nextPrayer);
	}	
	
	// ==========================Helper functions End===========================
	
	
}())