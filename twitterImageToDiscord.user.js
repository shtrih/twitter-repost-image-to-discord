// ==UserScript==
// @name         Repost Image to Discord via Webhook
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Post image in one click!
// @author       shtrih
// @match        https://twitter.com/*
// @grant        GM_xmlhttpRequest
// @connect      discordapp.com
// @homepage     https://github.com/shtrih
// ==/UserScript==
// https://discordapp.com/developers/docs/resources/webhook#execute-webhook

(function() {
    'use strict';

    console.log($.fn.jquery);

    const hookUri = 'https://discordapp.com/api/webhooks/541326072134762496/i3cz92MdCbihC3QO3puIlMKdWXLPAJn7ZEfVelr3JvUun70hmd1ofHH2sHiH8Tuis0Xn',
          data = {
              // content string	     the message contents (up to 2000 characters)	one of content, file, embeds
              // username	string	 override the default username of the webhook	false
              // avatar_url	string	 override the default avatar of the webhook	false
          },
          button = $('<div id="dscrd-share" style="position: absolute; background: rgba(255, 255, 255, 0.5); font-size: 12px; padding: 0 4px; z-index: 2;">Share</div>')
    ;
    let $imageContainer;

    button.on('click', (e) => {
        e.stopPropagation();

        const tweetHeader = $imageContainer.parents('.content').children('.stream-item-header'),
            tweetAuthorLogin = $('.username', tweetHeader).first().text(),
            tweetAuthorAvatar = $('img.avatar', tweetHeader).attr('src')
        ;

        data.text = $imageContainer.children('img').attr('src');
        data.username = tweetAuthorLogin;
        // Soo strange. If you use an avatar then discord didn't show a preview of the image!
        //data.icon_url = tweetAuthorAvatar;

        GM_xmlhttpRequest({
            method: 'POST',
            /**
            * @see https://api.slack.com/custom-integrations/incoming-webhooks#legacy-customizations
            * Using Slack hook because I have no idea why default hook api respond http error code 400.
            */
            url: hookUri + '/slack',
            data: JSON.stringify(data),
            overrideMimeType: 'application/json',
            onload: (res) => {
                console.log(res);
            }
        });
    });

    $('#stream-items-id')
        .on('mouseenter', '.AdaptiveMedia-container .AdaptiveMedia-photoContainer', (e) => {
            $imageContainer = $(e.currentTarget);

            $imageContainer.prepend(button);
        })
        .on('mouseleave', '.AdaptiveMedia-container .AdaptiveMedia-photoContainer', (e) => {
            $('#dscrd-share', e.currentTarget).detach();
        })
    ;
})();