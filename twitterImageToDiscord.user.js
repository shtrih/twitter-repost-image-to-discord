// ==UserScript==
// @name         Repost Image to Discord (or to Slack) via Webhook
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Post image in one click!
// @author       shtrih
// @match        https://twitter.com/*
// @grant        GM_xmlhttpRequest
// @connect      discordapp.com
// @connect      hooks.slack.com
// @homepage     https://github.com/shtrih
// ==/UserScript==

/**
* @see https://api.slack.com/custom-integrations/incoming-webhooks#legacy-customizations
* @see https://discordapp.com/developers/docs/resources/webhook#execute-webhook
*/

// Set your webhook here!
const config = {
    discordHookUri: '', // https://discordapp.com/api/webhooks/00000000000000000000/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    slackHookUri: '' // https://hooks.slack.com/services/T00000000/XXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
};

document.onreadystatechange = function () {
    'use strict';

    if (document.readyState != "complete") {
        return;
    }

    if (typeof($) !== "function") {
        console.log('no jquery!');
        return;
    }

    console.log($.fn.jquery);

    const data = {
              // text       string   the message contents (up to 2000 characters)	one of content, file, embeds
              // username   string   override the default username of the webhook	false
              // icon_url   string   override the default avatar of the webhook	false
          },
          buttons = $(
              (config.discordHookUri ? '<div class="btn-link share-42 dscrd" style="position: absolute; background: rgba(255, 255, 255, 0.9); font-size: 12px; padding: 0 4px; z-index: 2;">to Discord</div>' : '')
              + (config.slackHookUri ? '<div class="btn-link share-42" style="position: absolute; top: 20px; background: rgba(255, 255, 255, 0.9); font-size: 12px; padding: 0 4px; z-index: 2;">to Slack</div>' : '')
          )
    ;
    let $imageContainer;

    buttons.on('click', (e) => {
        e.stopPropagation();

        const
            isDiscord = $(e.target).hasClass('dscrd')
            , tweetHeader = $imageContainer.parents('.content').children('.stream-item-header')
            , tweetAuthorLogin = $('.username', tweetHeader).first().text()
            // , tweetAuthorAvatar = $('img.avatar', tweetHeader).attr('src')
        ;

        data.text = $imageContainer.children('img').attr('src');
        data.username = tweetAuthorLogin;
        // Soo strange. If you use an avatar then Discord didn't show a preview of the image!
        //data.icon_url = tweetAuthorAvatar;

        GM_xmlhttpRequest({
            method: 'POST',
            /**
            * @see https://api.slack.com/custom-integrations/incoming-webhooks#legacy-customizations
            * Using Slack hook because I have no idea why default hook api respond http error code 400.
            */
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

    $('#stream-items-id')
        .on('mouseenter', '.AdaptiveMedia-container .AdaptiveMedia-photoContainer', (e) => {
            $imageContainer = $(e.currentTarget);

            $imageContainer.prepend(buttons);
        })
        .on('mouseleave', '.AdaptiveMedia-container .AdaptiveMedia-photoContainer', (e) => {
            $('.share-42', e.currentTarget).detach();
        })
    ;
};