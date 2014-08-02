/**
 * wpstubs
 * Theopolisme <theopolismewiki@gmail.com>
 */

( function ( require ) {
    var changes, client, twitter,

        // modules
        http = require( 'http' ),
        he = require( 'he' ),
        wikibot = require( 'nodemw' ),
        wikichanges = require( 'wikichanges' ),
        Twit = require( 'twit' ),
        Mustache = require( 'mustache' ),

        // const
        CONST = {
            linkLength: 22,
            templateTitleRegex: /<template[^>]*>\s*<title[^>]*>\s*(.*?)\s*<\/title>/g,
            ignoreList: [
                // ignore shells
                'wikiproject banner shell',
                'wikiproject shell banner',
                'wikiprojectbannershell'
            ]
        },

        // config
        CONFIG = require( './config.json' );

    function getTemplateModel ( name, callback ) {
        client.api.call( {
            action: 'query',
            prop: 'revisions',
            rvprop: 'content',
            rvgeneratexml: true,
            format: 'json',
            indexpageids: true,
            titles: name
        }, function ( data, next, raw ) {
            var xml = data.pages[data.pageids[0]].revisions[0].parsetree;
            console.log( xml );
            callback && callback( xml );
        }, 'POST' );
    }

    function getTemplateNames ( model ) {
        var match, names = [],
            titleRegex = CONST.templateTitleRegex;

        match = titleRegex.exec( model );

        while ( match !== null ) {
            names.push( match[1] );
            match = titleRegex.exec( model );
        }

        return names;
    }

    function getHashtags ( templateNames ) {
        var hashtags = [],
            i = 0;

        function getHashtag ( name ) {
            // screw it
            if ( !/wikiproject/i.test( name ) ) {
                return false;
            }

            if ( CONST.ignoreList.indexOf( name.toLowerCase() ) !== -1 ) {
                return false;
            }

            return he.decode(
                name
                    .replace( /^wikiproject\s*/i, '' )
                    .replace( /\s*/g, '' )
            );
        }

        for ( i; i < templateNames.length; i++ ) {
            var hashtag = getHashtag( templateNames[i] );
            if ( hashtag ) {
                hashtags.push( hashtag );
            }
        }

        return hashtags;
    }

    function makeTweet ( name, hashtags, url ) {
        var template = CONFIG.tweet,
            reducedHashtags = hashtags;

        // Ensure the tweet is no more than 140 characters
        function getLength () {
            return Mustache.render( template, {
                title: name,
                hashtags: reducedHashtags,
                link: ''
            } ).length + CONST.linkLength;
        }

        while ( getLength() > 140 ) {
            if ( reducedHashtags.length > 1 ) {
                reducedHashtags.pop();
            } else {
                // no hashtags, no tweet. DUN DUN DUNNN
                return false;
            }
        }

        return Mustache.render( template, {
            title: name,
            hashtags: reducedHashtags,
            link: url + ( url.indexOf( '?' ) === -1 ? '?' : '&' ) + 'src=wpstubs'
        } );
    }

    function postTweet ( tweet ) {
        if ( CONFIG.dry ) {
            console.log( 'Would be tweeting: ' + tweet );
        } else {
            twitter.post( 'statuses/update', { status: tweet }, function ( err, data, response ) {
                console.log( data );
            } );
        }
    }

    function handlePage ( name, url ) {
        if ( CONFIG.debug ) {
            console.log( 'handling page "' + name + '"' );
        }

        // Skip dabs
        if ( name.indexOf( '(disambiguation)' ) !== -1 ) {
            return;
        }

        // Strip Talk: stuff... -.-
        articleName = he.decode( name.replace( /^Talk:/, '' ) );
        articleUrl = url.replace( /Talk:/, '' );

        getTemplateModel( name, function ( model ) {
            var tweet, hashtags = getHashtags( getTemplateNames( model ) );

            if ( CONFIG.debug ) {
                console.log( 'hashtags: ' + hashtags );
            }

            if ( hashtags.length ) {
                // Remove Talk: from url
                tweet = makeTweet( articleName, hashtags, articleUrl );
            }

            if ( tweet ) {
                postTweet( tweet );
            }
        } );
    }

    twitter = new Twit( CONFIG.twitter );
    client = new wikibot( CONFIG.wikipedia, { debug: CONFIG.debug } );
    changes = new wikichanges.WikiChanges( {
        ircNickname: CONFIG.nick,
        wikipedias: [ '#en.wikipedia' ]
    } );

    changes.listen( function ( change ) {
        if ( change.newPage && change.namespace === 'talk' ) {
            handlePage( change.page, change.pageUrl );
        }
    } );

}( require ) );
