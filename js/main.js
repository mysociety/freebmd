// Document ready

$(function() {

	// Pick a random image to play with if one's not set
	pickRandomImage();

});

// Functions

// Pick a random image number (from 1-6) and put the image in
// where it needs to go - unless one's already been chosen
function pickRandomImage() {
	// Remove any old image first
	$("#background img").remove();
	var number = localStorage.getItem("image") || Math.floor((Math.random()*6)+1);
	var src = "img/document" + number + ".jpeg";
	var image = "<img src=\"" + src + "\" id=\"document-image\">";
	if($('body').hasClass("transcribe")) {
		$("#background-overlay-top").after(image);
	}
	else {
		$("#background").prepend(image);
	}
	
	// Re-adjust things based on the new image
	$("#document-image").one("load", function (e) {
		// Size the grid overlay relative to the image
		$("#grid-overlay").css("height", $("#document-image").height() + 40);
		// Size the containers to force the document to be big enough
		// for the image
		$("#background").css("width", $("#document-image").width() + 60);
		$("#container").css("width", $("#document-image").width() + 228);
	}).each(function(){
		if(this.complete) {
			$(this).trigger("load");
		}
	});

	localStorage.setItem("image", number);
}

// Load all slices
function loadSlices() {
	var slices = JSON.parse(localStorage.getItem("slices"));
	if(slices == null) {
		slices = [];
	}
	return slices;
}

// Load a slice
function loadSlice(sliceId) {
	var slices = loadSlices();	
	if(sliceId < slices.length) {
		return slices[sliceId];	
	}
	else {
		return null;
	}
}
