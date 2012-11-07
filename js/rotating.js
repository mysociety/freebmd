(function ($) {

	// Document ready
	$(function() {
		// Delete button click
		$("a#delete").click(function (e) {
			e.preventDefault();
			var sure = confirm("This will wipe everything for this document, are you sure?");
			if(sure) {
				localStorage.clear();
				pickRandomImage();
				alert("Data wiped!");
			}
		});

		// Left rotate button click
		$("a#left").click(function (e) {
			e.preventDefault();
			rotate("#background img", false);
			return false;
		});

		// Right rotate button click
		$("a#right").click(function (e) {
			e.preventDefault();
			rotate("#background img", true);
			return false;
		});

		// Save button click
		$("a#rotate-save").click(function (e){
			var angle = getAngle("#background img");
			localStorage.setItem("angle", angle);
		});

		// Setup things which need to know the size of the image
		$("#background img").one("load", function (e) {
			console.log("rotating: image has loaded - do resizing things");
			// Size the grid overlay relative to the image
			$("#grid-overlay").css("height", $("#background img").height() + 40);
		}).each(function(){
			if(this.complete) {
				$(this).trigger("load");
			}
		});
	});

	// Functions

	// Get the current rotation angle of an object and
	// return it as a float 
	function getAngle(selector){
		var readAngle = parseFloat($(selector).getRotateAngle());
		return isNaN(readAngle) ? 0 : readAngle;
	}

	// Rotate an image
	function rotate(selector, forwards) {
		var img = $(selector);			
		var angle = getAngle(img);
		if(forwards) {
			$(img).rotate(angle + 0.1);
		}
		else {
			$(img).rotate(angle - 0.1);	
		}
	}

})($);