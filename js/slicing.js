(function ($) {
	
	// Document ready
	$(function() {

		if($("body").hasClass("slice")) {

			// Use rotation angle
			var angle = parseFloat(localStorage.getItem("angle"));
			$("#background img").rotate(angle);

			// Let people use up/down arrows to scroll the document
			// has to be keydown not keypress for some reason
			$(document).keydown(function (e) {
				e.preventDefault();
				var currentPos = $("#background").scrollTop();				
				switch(e.which) {
					case 38:
						// Up key
						if(currentPos > 0) {
							$("#background").scrollTop(currentPos - 5);
						}
						break;
					case 40: 
						// Down key
						if(currentPos < $("#background img").height()) {
							$("#background").scrollTop(currentPos + 5);
						}
						break;					
					case 13:
						// Carriage return/enter
						// flash the guillotine background to show
						// that we've sliced it
						slice("#guillotine");
						break;
				}
				return false;
			});

			// Slice button click
			$("a#slice").click(function (e) {
				e.preventDefault();
				slice("#guillotine");
				return false;
			});

			// Make the background div "kinetic"
			// (I'm not sure that's an adjective)
			$("#background").kinetic({
				// trigger hardware acceleration in iOs
				triggerHardware:true,
				// don't let it move fast
				maxVelocity:1,
				// Don't let it scroll left/right, only up/down
				x:false,
				y:true
			});

			// Make the slice button stick to the bottom
			positionFooter(); 
			$(window).scroll(positionFooter).resize(positionFooter);

			// Place and size the guillotine relative to the image
			// so that we can calculate things from it's
			// position later (once it's loaded).
			// Also size the background container/padding accordingly
			$("#background img").load(function () {
				var height = $("#background img").height();
				var width = $("#background").outerWidth();

				$("#guillotine").css({
					"top": ($("#background").position().top + 25) + "px",
					"width": (width + 50) + "px"
				}).show();

				// Make the "guillotine" resizable, but on the y axis only
				$("#guillotine").resizable({
					maxWidth:width + 50,
					minWidth:width + 50,
					handles:{
						"nw":"#nwgrip",
						"ne":"#negrip",
						"sw":"#swgrip",
						"se":"#segrip",
						"s":"#sgrip",
						"n":"#ngrip"
					},
					alsoResize: "#guillotine-lines"
				});

				$("#background_padding").css("height", height);
				$("#background").css("height", height);

			});			
		}
	});

	// Functions

	// Slice an image
	function slice(selector) {
		// Load slices
		var slices = loadSlices();

		// Animate the guillotine for effect
		$("#guillotine-lines").animate({
				backgroundColor: "#FFF",
				opacity: "100%"
			}, 300, 'swing', function(){

				// Note we measure the guillotine, which is
				// bigger than the lines show - that's
				// intentional!
				var height = $("#guillotine-lines").outerHeight();
				var guillotineTop = calculateGuillotineTop();

				// Insert a .captured-area div to highlight
				// the area that was just captured
				$("#background").append(newCaptureDiv(slices));
				// Position it and display it
				$("#capture-" + slices.length).css({
					"top": guillotineTop,
					"height": height - 4
				}).show();

				// Return guillotine to normal
				$(this).css({"background-color": "transparent"});

				// Save slice coordinates into localStorage
				slices.push({
					"top": guillotineTop,
					"bottom": guillotineTop + height
				});
				localStorage.setItem("slices", JSON.stringify(slices));
			});
	}

	// Position the footer
	function positionFooter(){
		$("a#slice").css({
			position: "absolute",
			top:($(window).scrollTop()+$(window).height()-$("a#slice").outerHeight())+"px"})	
	}

	// Return a new "captured" div
	function newCaptureDiv(slices) {
		var id = slices.length;
		var html = "<div id=\"capture-" + id + "\" class=\"captured-area\">";
		html += "<span class=\"capture-caption\">Capture " + (id + 1) + "</span>";
		html += "</div>";
		return html;
	}

	// Calculate the guillotine top relative to the 
	// position of the background image so that we know
	// where it is actually "slicing"
	function calculateGuillotineTop() {
		// Both of these elements are positioned inside
		// #container, so the position() method returns
		// values relative to this
		var guillotineTop = $("#guillotine").position().top + $("#guillotine-lines").position().top;
		var backgroundTop = $("#background").position().top + parseInt($("#background").css("margin-top"));;  
		// How far is the background scrolled
		var backgroundScrollTop = $("#background").scrollTop();

		return backgroundScrollTop + (guillotineTop - backgroundTop);
	}
})($);
	