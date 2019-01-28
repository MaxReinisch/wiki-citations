// This script adds buttons next to isbns on wikipedia pages that will redirect
// the user to a readable digital copy of the referenced book.

// <nowiki>
( function () {
	function addBookIcon(id, metadata, page){
	  var toolTip = createBookWindow(metadata, id, page)
	  return createArchiveAnchor(id, toolTip)
	}
	function addDonateIcon(isbn){
		var toolTip = createDonateWindow(isbn)
		return createArchiveAnchor(false, toolTip)
	}

	function createBookWindow (metadata, id, page) {
	  var link = 'https://archive.org/details/' + id
	  if(page){
	  	link = link + '/page/' + page
	  }

	  return $('<a>')
	  .attr({'href': link , 'target':'_blank', 'class': 'popup_box'})
	  .append(
	  	$('<div>')
	  		.attr({ 'class': 'text_elements_read' })
	  		.append(
	    		$('<p>').append($('<strong>').text(metadata.title)),
	    		$('<p>').text(metadata.author)
			),
	  	$('<div>')
	  		.attr({'class': 'bottom_details_read'})
	  		.append(
	    		metadata.image ? $('<img>').attr({'src': metadata.image, 'class': 'cover_img_read' }) : null,
	    		$('<p>').text('Click To Read Now')
	    	)
	    )[0].outerHTML
	}

	function createDonateWindow(isbn){
		var donation = 50
		var username = mw.config.get('wgUserName')
		return $('<div>')
			.attr({'class': 'popup_box'})
			.append(
				$('<div>')
					.attr({'class':'text_elements_donate' })
					.append(
						$('<a>')
						.attr({'target':'_blank', 'href': 'https://www.archive.org/donate?isbn=' + isbn + '&donation=' + donation + '&username=' + username})
						.append(
							$('<strong>').text("Please donate $50 and we will try to purchase and digitize the book for you.")
						)
					),
				$('<div>')
					.attr({'class':'bottom_details_donate'})
					.append(
						$('<p>').text("Or if you have a copy of this book please mail it to: "),
				    	$('<p>').text('300 Funston, San Francisco, CA 94118'),
				    	$('<p>').text('so we can digitize it.')
					)
			)[0].outerHTML
	}
	function createArchiveAnchor (id, tt) {
		if(id){
			var popupButton = new OO.ui.PopupButtonWidget( {
				label: '📖 Read Now',
				target: '_blank',
				framed: false,
				classes: ['btn-archive-book'],
				popup: {
					$content: $(tt),
					padded: false,
					align: 'forwards',
					classes: 'popup-archive',
					width:180
				}
			} );
		}else{
			var popupButton = new OO.ui.PopupButtonWidget( {
				label: '📚 Donate',
				target: '_blank',
				framed: false,
				classes: ['btn-archive-donate'],
				popup: {
					$content: $(tt),
					padded: false,
					align: 'forwards',
					classes: 'popup-archive',
					width:180
				}
			} );
		}
		return popupButton
	}


	function getIdentifier (book) {
	  // identifier can be found as metadata.identifier or ocaid
	  if (book) {
	    var id = ''
	    if (book.metadata) {
	      id = book.metadata.identifier
	    } else {
	      id = book.ocaid
	    }
	    if (id) {
	      return id
	    }
	  }
	  return null
	}

	function getISBNFromCitation (citation) {
	  // Takes in HTMLElement and returns isbn number or null if isbn not found
	  var rawISBN = citation.text
	  var isbn = rawISBN.replace(/-/g, '')
	  return isbn
	}
	function getPageFromCitation(book){
		var raw = book.parentElement.innerText
		var re = /p{1,2}\.\s(\d+)-?\d*/g
		var result = re.exec(raw)
		if(result){
			return result[1]
		}
		return result
	}

	// Get all books on wikipedia page through
	// https://archive.org/services/context/books?url=...
	function getWikipediaBooks (url) {
	  return $.ajax({
	    dataType: "json",
	    crossDomain: true,
	    url: 'https://archive.org/services/context/books?url=' + url,
	    beforeSend: function(jqXHR, settings) {
	       jqXHR.url = settings.url;
	   },
	    timeout: 10000
	  })
	}


	function getMetadata (book) {
	  const MAX_TITLE_LEN = 300
	  if (book) {
	    if (book.metadata) {
	      return {
	        'title': book.metadata.title.length > MAX_TITLE_LEN ? book.metadata.title.slice(0, MAX_TITLE_LEN) + '...' : book.metadata.title,
	        'author': book.metadata.creator,
	        'image': 'https://archive.org/services/img/' + book.metadata.identifier,
	        'link': book.metadata['identifier-access'],
	        'button_text': 'Read Now',
	        'button_class': 'btn btn-success resize_fit_center',
	        'readable': true
	      }
	    }
	  }
	  return false
	}

	/**
	 * Customizes error handling
	 * @param status {string}
	 * @return {string}
	 */
	function getErrorMessage(req){
	  return "The requested service " + req.url + " failed: " + req.status + ", " + req.statusText
	}

	if( mw.config.get( "wgNamespaceNumber" ) === 0 ) {
		$.when( mw.loader.using( [ 'oojs-ui-core' ] ), $.ready ).done( function () {
			getWikipediaBooks(location.href).done(function(data) {
			    var books = $("a[title^='Special:BookSources']")
			    for (var book of books) {
			      var isbn = getISBNFromCitation(book)
			      var pageNumber = getPageFromCitation(book)
			      var id = getIdentifier(data[isbn])
			      var metadata = getMetadata(data[isbn])
			      var icon
			      if (id) {
			        icon = addBookIcon(id, metadata, pageNumber)
			      }else{
			      	icon = addDonateIcon(isbn)
			      }
			      book.parentElement.append(icon.$element[0])
			    }
			}).fail( function( xhr, status ) {
			    console.log(getErrorMessage(xhr))
			});
		});
	}
}() );
