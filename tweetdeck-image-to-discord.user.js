// ==UserScript==
// @name         Repost Image to Discord (or to Slack) via Webhook
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Post image in one click!
// @author       shtrih
// @match        https://tweetdeck.twitter.com/*
// @require      https://code.jquery.com/jquery-3.3.1.min.js#sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=
// @grant        GM_xmlhttpRequest
// @connect      discordapp.com
// @connect      hooks.slack.com
// @homepage     https://gist.github.com/shtrih/3dc6fb5aac1bb87f3e803acccfb74b67
// @website      https://github.com/shtrih
// ==/UserScript==

/**
* @see https://api.slack.com/custom-integrations/incoming-webhooks#legacy-customizations
* @see https://discordapp.com/developers/docs/resources/webhook#execute-webhook
*/

(function($) {
    'use strict';

    // Set your webhook here!
    const config = {
        reposterNickname: '', // Your nickname
        reposterAvatar: '', // An avatar url, for example https://avatars.slack-edge.com/2017-12-21/289683552497_80f1fdcf05f0b302b12f_192.png

        discordHookUri: '', // https://discordapp.com/api/webhooks/00000000000000000000/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        slackHookUri: '' // https://hooks.slack.com/services/T00000000/XXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    };

    console.log($.fn.jquery);

    const data = {
              // text       string   the message contents (up to 2000 characters)	one of content, file, embeds
              // username   string   override the default username of the webhook	false
              // icon_url   string   override the default avatar of the webhook	false
          },
          buttons = $(
              (config.discordHookUri ? '<a class="link-complex share-42 dscrd" style="display: block; position: absolute; top: 15px; background: rgba(255, 255, 255, 0.9); font-size: 12px; padding: 0 4px; z-index: 2;">to Discord</a>' : '')
              + (config.slackHookUri ? '<a class="link-complex share-42" style="display: block; position: absolute; top: 35px; background: rgba(255, 255, 255, 0.9); font-size: 12px; padding: 0 4px; z-index: 2;">to Slack</a>' : '')
          )
    ;
    let $imageContainer;

    buttons.on('click', (e) => {
        e.stopPropagation();

        const
            isDiscord = $(e.target).hasClass('dscrd')
            , tweetHeader = $imageContainer.parents('.js-stream-item-content').find('.js-tweet-header')
            , tweetAuthorLogin = $('.username', tweetHeader).text()
            , imageUri = $imageContainer.attr('style').replace('background-image:url(', '')/*.replace('?format=jpg', '')*/.replace(/&name=[^)]+[)]/, '')
            // , tweetAuthorAvatar = $('img.tweet-avatar', tweetHeader).attr('src')
        ;


        if (config.reposterNickname) {
            data.username = config.reposterNickname + ' 🔁';
            data.text = 'by '+ tweetAuthorLogin +'\n' + imageUri;
        }
        else {
            data.username = tweetAuthorLogin;
            data.text = imageUri;
        }

        if (config.reposterAvatar && !isDiscord) {
            data.icon_url = config.reposterAvatar;
        }

        GM_xmlhttpRequest({
            method: 'POST',
            url: isDiscord ? config.discordHookUri + '/slack' : config.slackHookUri,
            data: JSON.stringify(data),
            overrideMimeType: 'application/json',
            onload: (res) => {
                if (res.status !== 200) {
                    alert('Error send request to ' + (isDiscord ? 'Discord' : 'Slack') + '. See console (F12).');
                    console.log(res);
                }
            }
        });
    });

    $('.js-app')
        .on('mouseenter', '.js-media-image-link', (e) => {
            $imageContainer = $(e.currentTarget);

            $imageContainer.parent().prepend(buttons);
        })
    ;
})(jQuery);