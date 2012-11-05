(function () {
	$(function() {
		// Use rotation angle
		var angle = parseFloat(localStorage.getItem("angle"));
		$("#background img").rotate(angle);

		// Load the correct form if it's been chosen
		loadCurrentForm();

		// Load current slice
		var currentSlice = getCurrentSlice();

		// Load slice from data supplied when the image has
		// loaded (even when it's come from the cache)
		$("#document-image").one("load", function (e) {
			loadSliceIntoTranscribePage(currentSlice);
		}).each(function(){
			if(this.complete) {
				$(this).trigger("load");
			}
		});

		// Capture enter key in form fields to move to next
		$('input').keypress(function (e) {
            if(e.which == 13) {
                if(!$(this).hasClass("last")){
                    e.preventDefault();
                    $(":input:eq(" + ($(":input").index(this) + 1) + ")").focus();
                }
            }
        }); 

		// Capture form submissions
        $("#transcribe_form").submit(function(e) {
        	e.preventDefault();
        	var currentSlice = getCurrentSlice();
        	var slices = loadSlices();
        	var values = $("#transcribe_form").values();
        	if($("#transcribe_form").hasClass("header")) {
        		localStorage.setItem("header", true);
        		localStorage.setItem("year", values.year);
        	}
        	slices[currentSlice]["transcription"] = values;
        	localStorage.setItem("slices", JSON.stringify(slices));
        	loadNextSlice(currentSlice, slices);
        });

        // Previous link clicks
        $("a#previous-slice").click(function (e) {
        	e.preventDefault();
        	var currentSlice = getCurrentSlice();
        	var slices = loadSlices();
        	loadPreviousSlice(currentSlice, slices);
        });

        // All done link click
        $("a#all-done").click(function (e) {
        	e.preventDefault();
        	alert("Thanks!");
        });

        // Save-but-don't-change link click
        $("a#save-header-no-next").click(function (e) {
        	e.preventDefault();
        	var currentSlice = getCurrentSlice();
        	var slices = loadSlices();
        	localStorage.setItem("header", true);
        	slices[currentSlice]["transcription"] = $("#transcribe_form").values();
        	localStorage.setItem("slices", JSON.stringify(slices));
        	// Don't load the next slice, stay here and reload the form
        	loadCurrentForm();
        });

        // This is a header button click
        $("#is-header-button").click(function () {
        	loadForm("#header-form");
        });
	});

	// Functions
	// load the previous slice
	function loadPreviousSlice(currentSlice, slices) {
		if(currentSlice > 0) {
			currentSlice--;
			localStorage.setItem("currentSlice", currentSlice);
			loadSliceIntoTranscribePage(currentSlice);
		}
		else {
			alert("There are no more slices!");
		}
	}

	// load the next slice
	function loadNextSlice(currentSlice, slices) {
		if(currentSlice < (slices.length - 1)) {
			currentSlice++;
			localStorage.setItem("currentSlice", currentSlice);
			loadSliceIntoTranscribePage(currentSlice);
		}
		else {
			alert("You've done all the slices!");
		}
	}

	// Load a slice of an image into the transcribe page
	function loadSliceIntoTranscribePage(sliceId) {
		var slice = loadSlice(sliceId); 
		scrollDocumentToSlice(slice);
		drawOverlay(slice);
		loadCurrentForm();
		populateTranscriptionForm(slice, sliceId);
		updateSliceCounter(sliceId);
	}

	// Scroll the "window" of the document shown on
	// the transcribe page to center the given
	// slice - window means the div containing it
	function scrollDocumentToSlice(slice) {
		var windowHeight = $("#background").outerHeight();
		var windowMiddle = windowHeight / 2;
		var sliceMiddle = (slice.bottom - slice.top) / 2;
		var desiredTop = (slice.top - windowMiddle) + sliceMiddle;
		var currentTop = $("#background").scrollTop();
		if(desiredTop !== currentTop) {
			$("#background").scrollTop(desiredTop);
		}
	}	

	// Draw the overlay that shows where a snippet comes from
	// in a larger document
	function drawOverlay(slice) {

		// Draw the "highlight overlay"
		$("#slice-overlay").css({
			"top": slice.top - 10,
			"height": (slice.bottom - slice.top) + 20
		}).show();

		// Draw the lowlight overlays
		$("#background-overlay-top").css({
			"height": slice.top - 10
		}).show();

		$("#background-overlay-bottom").css({
			"height": 1095 - slice.bottom - 11,
			"top": slice.bottom + 14
		}).show();
	}

	// Populate the transcription form with data (if there is any)
	function populateTranscriptionForm(slice, sliceId) {
		var prevSlice, year;
		var slices = loadSlices();
		
		// Blank the form first because browsers helpfully
		// remember old things	
		$("#transcribe_form input[type='text']").val("");
		$("#transcribe_form input[type='checkbox']").attr("checked", false);
		
		if(typeof slice.transcription !== "undefined") {
			// The slice has been edited before, load the data
			$("#transcribe_form").values(slice.transcription);
		}
		else if(sliceId > 0) {
			// If there's a slice before it might have a full date
			prevSlice = slices[sliceId-1];
			if(typeof prevSlice.transcription !== "undefined" 
				&& typeof prevSlice.transcription.date !== "undefined"
				&& prevSlice.transcription.date !== "") {
					$("input#date").val(prevSlice.transcription.date);
			}
		}
		else if(JSON.parse(localStorage.getItem("header"))) {
			// A header has been set, we might know the year from that
			year = JSON.parse(localStorage.getItem("header"));			
			if(year && year !== "") {
				$("input#date").val("01/01/" + year);
			}
		}
	}

	function updateSliceCounter(sliceId) {
		var slices = loadSlices();
		$("#counter").html((sliceId + 1) + " / " + slices.length);
	}

	// Load current slice
	function getCurrentSlice() {
		var currentSlice = parseInt(localStorage.getItem("currentSlice"));
		if(isNaN(currentSlice)) {
			currentSlice = 0;
			localStorage.setItem("currentSlice", currentSlice);
		}
		return currentSlice;
	}

	// Load the right form template into the transcribe
	function loadCurrentForm() {
		var legend, actions;
		var headerLegend = "Enter the details from the header and choose the form template to use.";
		var formLegend = "Enter the details from the snippet you see into the form. Hit enter to move on.";
		var formTemplate = getFormTemplate() || "#header-form";
		var header = (formTemplate === "#header-form");

		if(header) {
			legend = headerLegend;
			actions = "#header-actions";
		}
		else {
			legend = formLegend;
			actions = "#transcribe-actions";
		}

		// Load the right div into the form
		$("#form-fields").html($(formTemplate).html());
		// Set the instructions
		$("#instructions").text(legend);
		// Load the actions
		$("#transcribe_form .form-actions").html($(actions).html());
		// Toggle the "this is a header" button
		$("#is-header-button").toggle(!header);
		// Toggle the form classes to identify it's purpose
		$("#transcribe_form").toggleClass("header", header);
		$("#transcribe_form").toggleClass("segment", !header);

	}

	// Get the the form template from localStorage
	// returns false if none is set
	function getFormTemplate() {
		var template = false;
		var header = localStorage.getItem("header") || false;

		console.log("header: " + header);

		if(header) {
			console.log("loading template");
			header = JSON.parse(header);
			console.log(header);
			template = header.template || false;
		}
		console.log("loaded template: " + template);
		return template;
	}

})($);