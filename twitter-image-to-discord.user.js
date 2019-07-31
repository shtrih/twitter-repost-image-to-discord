// ==UserScript==
// @name         twitter-image-to-discord.user.js
// @namespace    http://tampermonkey.net/
// @version      1.1.1
// @description  Repost Image to Discord (or to Slack) via Webhook in one click!
// @author       shtrih
// @match        https://twitter.com/*
// @require      https://code.jquery.com/jquery-3.4.1.slim.min.js#sha256-pasqAKBDmFT4eHoN2ndd6lN370kFiGUFyTiUHWhU7k8=
// @grant        GM_xmlhttpRequest
// @connect      discordapp.com
// @connect      hooks.slack.com
// @homepage     https://github.com/shtrih/twitter-repost-image-to-discord
// @website      https://github.com/shtrih
// ==/UserScript==

/**
 * @see https://api.slack.com/custom-integrations/incoming-webhooks#legacy-customizations
 * @see https://discordapp.com/developers/docs/resources/webhook#execute-webhook
 */

// Set your webhook here!
const config = {
    reposterNickname: '', // Your nickname. Set empty to use tweet author nickname.
    reposterAvatar: '', // An avatar url, for example https://avatars.slack-edge.com/2017-12-21/289683552497_80f1fdcf05f0b302b12f_192.png

    discordHookUri: '', // https://discordapp.com/api/webhooks/00000000000000000000/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    slackHookUri: '' // https://hooks.slack.com/services/T00000000/XXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
};
const STORAGE_KEY = 'twttr-img2dscrd';

run();

function run () {
    // move config for the future version
    saveConfig(config);

    setTimeout(function () {
        'use strict';

        console.log($.fn.jquery);

        const buttons = $(
                (config.discordHookUri ? '<div class="btn-link share-42 dscrd" style="position: absolute; background: rgba(255, 255, 255, 0.9); font-size: 14px; padding: 0 4px; z-index: 2;">to Discord</div>' : '')
                + (config.slackHookUri ? '<div class="btn-link share-42" style="position: absolute; top: 20px; background: rgba(255, 255, 255, 0.9); font-size: 14px; padding: 0 4px; z-index: 2;">to Slack</div>' : '')
            )
        ;
        let $imageContainer;

        buttons.on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const
                data = {
                    // text       string   the message contents (up to 2000 characters)	one of content, file, embeds
                    // username   string   override the default username of the webhook	false
                    // icon_url   string   override the default avatar of the webhook	false
                }
                , isDiscord = $(e.target).hasClass('dscrd')
                , tweet = $imageContainer.closest('article')
                , tweetAuthor = tweet.find('div > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a > div > div:nth-child(2) > div > span').text()
                , tweetPageAuthor = tweet.find('li > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > a > div > div:nth-child(2) > div > span').text()
                , retweetAuthor = tweet.find('div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a > div:nth-child(1) > div:nth-child(2) > div > span').text()
                , tweetAuthorLogin = tweetAuthor || tweetPageAuthor || retweetAuthor
                , imgSrc = $imageContainer.find('img')
                    .prev('div')
                    .attr('style')
                    // background-image: url("https://pbs.twimg.com/media/EA0z0mvVUAAY1Ck?format=jpg&name=small"); →
                    // → https://pbs.twimg.com/media/EA0z0mvVUAAY1Ck.jpg:orig
                    .replace('background-image: url("', '')
                    .replace('?format=', '.')
                    .replace(/&name=[^"]+"[)];$/, ':orig')
            ;

            data.username = tweetAuthorLogin;
            data.text = imgSrc;

            if (config.reposterNickname) {
                data.username = config.reposterNickname + ' 🔁';
                data.text = 'by ' + tweetAuthorLogin + '\n' + imgSrc;
            }

            // Soo strange. If you override webhook avatar then Discord didn't show a preview of the image!
            if (!isDiscord) {
                if (config.reposterAvatar) {
                    data.icon_url = config.reposterAvatar;
                }
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

        $('main')
            .on('mouseenter', 'section article img', (e) => {
                $imageContainer = $(e.currentTarget).closest('a');

                $imageContainer.prepend(buttons);
            })
            // .on('mouseleave', 'section article img', (e) => {
                // $('.share-42', e.currentTarget).detach();
            // })
        ;
    }, 4000);
}

function saveConfig(config) {
    return setLocalStorageItem(STORAGE_KEY, JSON.stringify(config));
}

function getLocalStorageItem(name) {
    try {
        return localStorage.getItem(name);
    }
    catch (e) {
        return null;
    }
}

function setLocalStorageItem(name, value) {
    try {
        localStorage.setItem(name, value);
    } catch (e) {
        console.log('Failed to set local storage item ' + name + ', ' + e + '.');
        return false;
    }

    return true;
}