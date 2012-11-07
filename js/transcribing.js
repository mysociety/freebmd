(function () {
	
	// Variables for the transcribe page
	var headerLegend = "Enter the details from the header and choose the form template to use.";
	var formLegend = "Enter the details from the snippet you see into the form. Hit enter to move on.";
	// Options for document templates
	var templateOptions;
	// Mapping for document type to options
	var docTypeTemplates = {
		"birth": ["#gaddesby-births"],
		"marriage": ["#standard-marriages", "#marriages-banns"],
		"death": ["#gaddesby-deaths", "#dorset-deaths-form"],
		"census": ["#1911-census-form", "#1861-census-form"]
	};
	
	// Document ready
	$(function() {		

		// Save full list of template options
		templateOptions = $("#form-template option");

		// Use rotation angle
		var angle = parseFloat(localStorage.getItem("angle"));
		$("#background img").rotate(angle);

		// Load current slice
		var currentSlice = getCurrentSlice();

		// Load slice from data supplied when the image has
		// loaded (even when it's come from the cache)
		$("#background img").one("load", function (e) {
			console.log("transcribing: image has loaded - do resizing things")
			loadSliceIntoTranscribePage(currentSlice);
		}).each(function(){
			if(this.complete) {
				$(this).trigger("load");
			}
		});

		// Capture form submissions
        $("#transcribe_form").submit(function(e) {
        	e.preventDefault();
        	var currentHeader;
        	// Get current slice and form values
        	var currentSlice = getCurrentSlice();
    		var slices = loadSlices();
        	var values = $("#transcribe_form").values();

        	// See if this is a header form or a data form
        	if($("#transcribe_form").hasClass("header")) {
        		// Header - so also save the data into the global header
        		localStorage.setItem("header", JSON.stringify(values));
        		slices[currentSlice]["template"] = "#header-form";
        	}
        	else {
        		// Not a header, so load the current header to get
        		// info from it
        		currentHeader = JSON.parse(localStorage.getItem("header"));
        		// Save the name of the form template used so that we can
    			// show the right one if we go back to it
    			slices[currentSlice]["template"] = currentHeader.template;
        	}

    		// Save data in slice
    		slices[currentSlice]["transcription"] = values;
    		localStorage.setItem("slices", JSON.stringify(slices));

        	// Load the next slice
        	loadNextSlice(currentSlice, slices);
        });

	});

	// Functions
	// load the previous slice
	function loadPreviousSlice(currentSlice, slices) {
		console.log("Loading previous slice from number: " + currentSlice);
		console.log("Slices supplied: " + slices);
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
		console.log("loading in slice number: " + sliceId);
		var slice = loadSlice(sliceId); 
		console.log("slice is: " + slice);
		console.log("Drawing overlay shading");
		drawOverlay(slice);
		console.log("scrolling document to show slice");
		scrollDocumentToSlice(slice);
		console.log("loading current form");
		loadCurrentForm(slice);
		console.log("populating form with data");
		populateTranscriptionForm(slice, sliceId);
		console.log("updating counter");
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

		// How much bigger to fudge the displayed segment:
		// by default 10% on top and bottom (ish)
		var fudgeFactor = Math.abs(((slice.bottom - slice.top) / 100) * 20);
		var overlayHeight = (slice.bottom - slice.top) + (2 * fudgeFactor);

		// Draw the "highlight overlay"
		$("#slice-overlay").css({
			"top": slice.top - fudgeFactor,
			"height": overlayHeight
		}).show();

		// Draw the lowlight overlays
		$("#background-overlay-top").css({
			"height": slice.top - fudgeFactor
		}).show();

		$("#background-overlay-bottom").css({
			// +4 is for the borders/drop shadows which javascript/jquery 
			// don't include in their calculations in .outerHeight()
			"height": $("#background img").outerHeight() - slice.bottom - fudgeFactor,
			"top": slice.bottom + fudgeFactor + 4
		}).show();

		// Resize the "window" of the snippet if it's
		// not big enough to contain it
		if(overlayHeight >= $("#background").outerHeight() - 40) {
			$("#background").css("height", overlayHeight + 40);
		}
	}

	// Populate the transcription form with data (if there is any)
	function populateTranscriptionForm(slice, sliceId) {
		var prevSlice, year;
		var dateIsSet = false;
		var slices = loadSlices();
		
		// Blank the form first because browsers helpfully
		// remember old things	
		$("#transcribe_form input[type='text']").val("");
		$("#transcribe_form input[type='checkbox']").attr("checked", false);
		
		if(typeof slice.transcription !== "undefined") {
			// The slice has been edited before, load the data
			$("#transcribe_form").values(slice.transcription);
			dateIsSet = true;
		}
		else if(sliceId > 0) {
			// If there's a slice before this one it might have a full date
			prevSlice = slices[sliceId-1];
			if(typeof prevSlice.transcription !== "undefined" 
				&& typeof prevSlice.transcription.date !== "undefined"
				&& prevSlice.transcription.date !== "") {
					$("input#date").val(prevSlice.transcription.date);
					dateIsSet = true;
			}
		}

		// If all else fails, try the header date
		if(!dateIsSet && JSON.parse(localStorage.getItem("header"))) {
			// A header has been set, we might know the year from that
			year = JSON.parse(localStorage.getItem("header")).year;			
			if(year && year !== "") {
				$("input#date").val("01/01/" + year);
			}
		}

		// Filter the template options
		$('select#document-type').trigger('change');
	}

	// Update the X / Y counter of slices
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

	// Load the current form into the transcribe page
	// by looking up the info in localStorage
	function loadCurrentForm(slice) {
		var legend, actions
		var templateId = getFormTemplate(slice) || "#header-form";
		var isHeader = (templateId === "#header-form");

		console.log("loading current form for slice: " + slice + " parsed template: " + templateId + " is header? " + isHeader);

		if(isHeader) {
			legend = headerLegend;
			actions = "#header-actions";
		}
		else {
			legend = formLegend;
			actions = "#transcribe-actions";
		}

		loadForm(templateId, isHeader, legend, actions);
	}

	// Load the right form template into the transcribe page
	function loadForm(templateId, isHeader, legend, actions) {
		// Kill any old tooltips
        console.log("killing old tooltips");
        $('input').tooltip('destroy');

        // unbind any old events
        $('input, select, a').unbind();

		// Load the right div into the form
		$("#form-fields").html($(templateId).html());
		// Set the instructions
		$("#instructions").text(legend);
		// Load the actions
		$("#transcribe_form .form-actions").html($(actions).html());
		// Toggle the "this is a header" button
		$("#is-header-button").toggle(!isHeader);
		// Toggle the form classes to identify it's purpose
		$("#transcribe_form").toggleClass("header", isHeader);
		$("#transcribe_form").toggleClass("segment", !isHeader);

		// Rebind form events
		console.log("rebinding events");
		bindFormEvents();

		// Filter the template options if we're on a header form
		if(isHeader) {
			$('select#document-type').trigger('change');
		}
	}

	// Get the current form template from localStorage either
	// for the current slice (if given) or for the current header
	// returns false if none is set for either
	function getFormTemplate(slice) {
		console.log("getting form template for slice: " + slice);
		var template = false;

		// If we're given a slice see what template it has
		if(slice !== null) {
			console.log("slice is not null, so looking in slice data");
			console.log(slice.template);
			template = slice.template || false;
			console.log("slice template is: " + template);
		}

		// If not, see if there are stored header settings
		if(!template) {
			console.log("loading template from header instead");
			var header = localStorage.getItem("header") || false;
			if(header) {
				header = JSON.parse(header);
				template = header.template || false;
				console.log("header template loaded");
			}
		}

		console.log("header is set? " + header);
		console.log("loaded template: " + template);

		return template;
	}

	// Bind handlers to all the form events - so that we can rebind after we load
	// a new form in
	function bindFormEvents() {

		// Capture enter key in form fields to move to next
		$('input').keypress(function (e) {
            if(e.which == 13) {
                if(!$(this).hasClass("last")){
                    e.preventDefault();
                    $(":input:eq(" + ($(":input").index(this) + 1) + ")").focus();
                }
            }
        }); 

		// Previous link clicks
        $("a#previous-slice").click(function (e) {
        	console.log("Previous slice link clicked");
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
        	// Save the header details into localStorage but not the slice
        	localStorage.setItem("header", JSON.stringify($("#transcribe_form").values()));
        	// Don't load the next slice, stay here and reload the form
        	loadCurrentForm(null);
        });

        // This is a header button click
        $("#is-header-button").click(function () {
        	loadForm("#header-form", true, headerLegend, "#header-actions");
        });

        // Tooltips on focus
        // Make new tooltips
        console.log("making new tooltips");
        $('input').tooltip({
        		trigger: 'focus',
        		title: function() {
        			return $(this).attr("placeholder");
        		},
        		placement: 'top'
        	}
        );

        // Trigger the tooltip on autofocussed elements
        $('input[autofocus]').trigger('focus');

        // Change events on the document type select elements
        console.log("Binding to document type change events");
        $('select#document-type').change(filterTemplateOptions);
	}

	// Filter template options to only those allowed
	function filterTemplateOptions() {

		console.log("Filtering template options");

		// Update the template select element to show only
    	// the right elements
    	var allowedTemplates = docTypeTemplates[this.value];

    	$('select#form-template')
    		.html(templateOptions)
    		.find('option')
    		.filter(function(index) {
    			return (jQuery.inArray(this.value, allowedTemplates)) == -1;
    		}).remove();
	} 

})($);