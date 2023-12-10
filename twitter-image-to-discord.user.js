// ==UserScript==
// @name         twitter-image-to-discord.user.js
// @namespace    https://github.com/shtrih
// @version      2.1
// @description  Repost Image to Discord via Webhook in one click!
// @author       shtrih
// @match        https://twitter.com/*
// @match        https://tweetdeck.twitter.com/*
// @require      https://code.jquery.com/jquery-3.4.1.min.js#sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=
// @require      https://code.jquery.com/ui/1.12.1/jquery-ui.min.js#sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU=
// @resource     UI_CSS https://code.jquery.com/ui/1.12.1/themes/vader/jquery-ui.css
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getResourceURL
// @connect      discordapp.com
// @connect      discord.com
// @homepage     https://github.com/shtrih/twitter-repost-image-to-discord
// @supportURL   https://github.com/shtrih/twitter-repost-image-to-discord/issues
// @downloadURL  https://github.com/shtrih/twitter-repost-image-to-discord/raw/master/twitter-image-to-discord.user.js
// @updateURL    https://github.com/shtrih/twitter-repost-image-to-discord/raw/master/twitter-image-to-discord.user.js
// @icon         https://tweetdeck.twitter.com/favicon.ico
// ==/UserScript==

/**
 * @see https://discord.com/developers/docs/resources/webhook#execute-webhook
 */

let config;
const STORAGE_KEY = 'twttr-img2dscrd';
const IS_TWEETDECK = window.location.hostname === 'tweetdeck.twitter.com';

run();

function run () {
    console.log($.fn.jquery);

    GM_addStyle('@import url('+GM_getResourceURL('UI_CSS')+')');
    GM_addStyle(`
        .${STORAGE_KEY}-button {
            position: fixed;
            bottom: 0;
            right: 0;
            font-size: 0;
            width: 32px;
            background-color: #222f75;
            color: #eee;
            fill: #eee;
            border-radius: 3px 0 0 0;
            z-index: 1000;
        }
        .${STORAGE_KEY}-button:hover {
            background-color: #865dca;
            cursor: pointer;
        }
        #${STORAGE_KEY} input[type=text], #${STORAGE_KEY} input[type=url] {
            width: 100%;
            ${IS_TWEETDECK ? 'color: #444;' : ''}
        }
        #${STORAGE_KEY} input:invalid {
          color: red;
        }
        #${STORAGE_KEY} label {
            display: inline-block;
            width: 100%;
        }
        .share-42 {
            position: absolute; 
            background: rgba(250, 250, 250, 0.9);
            font-size: 14px; 
            padding: 0 2px;
            margin: 0 2px;
            z-index: 2;
            color: #555;
            line-height: 16px;
        }
        .share-42:hover {
            text-decoration: underline;
        }
        /* tweetdeck */
        html.dark #${STORAGE_KEY} input[type=text], html.dark #${STORAGE_KEY} input[type=url] {
            color: #eee;
        }
        html.dark .share-42 {
            background: rgba(21, 32, 43, 0.9); 
        }
        .js-mediaembed .share-42 {
            display: none;
        }
    `);

    const settingsIcon = '<svg viewBox="0 0 24 24" class="settings"><g><path d="M12 8.21c-2.09 0-3.79 1.7-3.79 3.79s1.7 3.79 3.79 3.79 3.79-1.7 3.79-3.79-1.7-3.79-3.79-3.79zm0 6.08c-1.262 0-2.29-1.026-2.29-2.29S10.74 9.71 12 9.71s2.29 1.026 2.29 2.29-1.028 2.29-2.29 2.29z"></path><path d="M12.36 22.375h-.722c-1.183 0-2.154-.888-2.262-2.064l-.014-.147c-.025-.287-.207-.533-.472-.644-.286-.12-.582-.065-.798.115l-.116.097c-.868.725-2.253.663-3.06-.14l-.51-.51c-.836-.84-.896-2.154-.14-3.06l.098-.118c.186-.222.23-.523.122-.787-.11-.272-.358-.454-.646-.48l-.15-.014c-1.18-.107-2.067-1.08-2.067-2.262v-.722c0-1.183.888-2.154 2.064-2.262l.156-.014c.285-.025.53-.207.642-.473.11-.27.065-.573-.12-.795l-.094-.116c-.757-.908-.698-2.223.137-3.06l.512-.512c.804-.804 2.188-.865 3.06-.14l.116.098c.218.184.528.23.79.122.27-.112.452-.358.477-.643l.014-.153c.107-1.18 1.08-2.066 2.262-2.066h.722c1.183 0 2.154.888 2.262 2.064l.014.156c.025.285.206.53.472.64.277.117.58.062.794-.117l.12-.102c.867-.723 2.254-.662 3.06.14l.51.512c.836.838.896 2.153.14 3.06l-.1.118c-.188.22-.234.522-.123.788.112.27.36.45.646.478l.152.014c1.18.107 2.067 1.08 2.067 2.262v.723c0 1.183-.888 2.154-2.064 2.262l-.155.014c-.284.024-.53.205-.64.47-.113.272-.067.574.117.795l.1.12c.756.905.696 2.22-.14 3.06l-.51.51c-.807.804-2.19.864-3.06.14l-.115-.096c-.217-.183-.53-.23-.79-.122-.273.114-.455.36-.48.646l-.014.15c-.107 1.173-1.08 2.06-2.262 2.06zm-3.773-4.42c.3 0 .593.06.87.175.79.328 1.324 1.054 1.4 1.896l.014.147c.037.4.367.7.77.7h.722c.4 0 .73-.3.768-.7l.014-.148c.076-.842.61-1.567 1.392-1.892.793-.33 1.696-.182 2.333.35l.113.094c.178.148.366.18.493.18.206 0 .4-.08.546-.227l.51-.51c.284-.284.305-.73.048-1.038l-.1-.12c-.542-.65-.677-1.54-.352-2.323.326-.79 1.052-1.32 1.894-1.397l.155-.014c.397-.037.7-.367.7-.77v-.722c0-.4-.303-.73-.702-.768l-.152-.014c-.846-.078-1.57-.61-1.895-1.393-.326-.788-.19-1.678.353-2.327l.1-.118c.257-.31.236-.756-.048-1.04l-.51-.51c-.146-.147-.34-.227-.546-.227-.127 0-.315.032-.492.18l-.12.1c-.634.528-1.55.67-2.322.354-.788-.327-1.32-1.052-1.397-1.896l-.014-.155c-.035-.397-.365-.7-.767-.7h-.723c-.4 0-.73.303-.768.702l-.014.152c-.076.843-.608 1.568-1.39 1.893-.787.326-1.693.183-2.33-.35l-.118-.096c-.18-.15-.368-.18-.495-.18-.206 0-.4.08-.546.226l-.512.51c-.282.284-.303.73-.046 1.038l.1.118c.54.653.677 1.544.352 2.325-.327.788-1.052 1.32-1.895 1.397l-.156.014c-.397.037-.7.367-.7.77v.722c0 .4.303.73.702.768l.15.014c.848.078 1.573.612 1.897 1.396.325.786.19 1.675-.353 2.325l-.096.115c-.26.31-.238.756.046 1.04l.51.51c.146.147.34.227.546.227.127 0 .315-.03.492-.18l.116-.096c.406-.336.923-.524 1.453-.524z"></path></g></svg>',
        getReposterForm = (reposterNickname, isAuthorInText) => `<div class="reposter">
            <p><label>Your nickname: 
                <input type="text" placeholder="Optional" name="nickname" value="${reposterNickname}" /></label></p>
            <p>
                Image's author placement:
                <label><input type="radio" name="authorInText" value="0" ${isAuthorInText ? '' : 'checked'} />in nickname</label>
                <label><input type="radio" name="authorInText" value="1" ${isAuthorInText ? 'checked' : ''} />in message text</label>
            </p>
        </div>`,
        getHooksForm = (title, hook) => `<div class="hooks">
            <hr />
            <p><label>Title: <input type="text" placeholder="Post to Discord" value="${title}" /></label></p>
            <p><label>Webhook URL: <input type="url" placeholder="https://discord.com/api/webhooks/00000000000000000000/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" pattern="^https?:[/]{2}(discord(app)?[.]com)[/].+" value="${hook}" /></label></p>
        </div>`,
        spoilerTitle = '🕶️',
        textMessageTitle = '📝',
        getShareLinks = (title, hookIndex) => `<div class="btn-link share-42" data-hook-index="${hookIndex}">${title}</div>`,
        hook = function (title = '', uri = '') {
            return {title, uri}
        },
        convertLegacyConfig = function(config) {
            return config;
        },
        loadDialogState = function() {
            config = loadConfig();

            if (config) {
                config = convertLegacyConfig(config);
            }
            else {
                config = {
                    reposterNickname: '',
                    authorInText: 0,
                    hooks: [
                        hook()
                    ]
                }
            }

            dialogAddButton.before(
                getReposterForm(config.reposterNickname || '', config.authorInText || 0)
            );
            dialogAddButton.before(
                config.hooks.map((hook) => getHooksForm(hook.title, hook.uri)).join('')
            );
        },
        saveDialogState = function (dialog) {
            let cfg = {hooks: []};

            cfg.reposterNickname = $('input[name="nickname"]', dialog).val();
            cfg.authorInText = Number(
                $('input[name="authorInText"]:checked', dialog).val()
            );

            $('.hooks', dialog).each(function () {
                let inputs = $(this).find('input');
                const title = inputs.eq(0).val(),
                    uri = $.trim(inputs.eq(1).val())
                ;
                if (uri) {
                    cfg.hooks.push(hook(title, uri));
                }
            });

            config = cfg;
            saveConfig(cfg);
            shareButtonsCreate(cfg);
        },
        shareClickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const
                data = {
                    // content    string   the message contents (up to 2000 characters)	one of content, file, embeds
                    // username   string   override the default username of the webhook	false
                }
                , shareLink = $(e.target)
                , hookUri = config.hooks[ shareLink.data('hookIndex') ].uri
            ;
            let tweetAuthorLogin
                , imageUri
            ;
            if (IS_TWEETDECK) {
                const tweetHeader = $imageContainer.parents('.js-stream-item-content').find('.js-tweet-header');
                tweetAuthorLogin = $('.username', tweetHeader).text();
                imageUri = $imageContainer.attr('style')
                // background-image:url(https://pbs.twimg.com/media/EAuEVnVUYAId48z.jpg?format=jpg&name=small) →
                // → https://pbs.twimg.com/media/EAuEVnVUYAId48z.jpg:orig
                    .replace('background-image:url(', '')
                    .replace(/[?]format=[a-z]+/, '')
                    .replace(/&name=[^)]+[)]$/, ':orig')
                ;
            }
            else {
                const img = $imageContainer.find('img');
                imageUri = img.attr('src');

                // External link image has no :orig version
                if (!/[/]card_img[/]/.test(imageUri)) {
                    imageUri = img.prev('div')
                        .attr('style')
                        // background-image: url("https://pbs.twimg.com/media/EA0z0mvVUAAY1Ck?format=jpg&name=small"); →
                        // → https://pbs.twimg.com/media/EA0z0mvVUAAY1Ck.jpg:orig
                        .replace('background-image: url("', '')
                        .replace('?format=', '.')
                        .replace(/&name=[^"]+"[)];$/, ':orig')
                }

                let tweet = $imageContainer.closest('[role="blockquote"]');

                if (tweet.length) {
                    // quoted tweet body
                    tweetAuthorLogin = extractUsernameFromUri($imageContainer.closest('a').attr('href'))
                }
                else {
                    let link = $imageContainer.closest('a');

                    // External link
                    if (!link || link.attr("rel") === 'noopener noreferrer') {
                        tweet = $imageContainer.closest('article');
                        tweetAuthorLogin = extractUsernameFromUri(
                            tweet
                                .find('a')
                                .eq(1) // 0 - retweeted by (or tweet uri), 1 - tweet uri, 2 - tweet uri (or empty)
                                .attr('href')
                        );
                    }
                    else {
                        tweetAuthorLogin = extractUsernameFromUri(link.attr('href'))
                    }
                }
            }

            data.username = tweetAuthorLogin;
            data.content = imageUri;
            if (shareLink.text() === spoilerTitle) {
                data.content = `|| ${data.content} ||`;
            } else if (shareLink.text() === textMessageTitle) {
                let message = prompt("Enter your message");
                data.content = `${message}\n${data.content}`;
            }

            if (config.reposterNickname) {
                data.username = config.reposterNickname + ' 🔁 ' + tweetAuthorLogin;

                if (config.authorInText) {
                    data.content = 'by `' + tweetAuthorLogin + '`:\n' + data.content;
                    data.username = config.reposterNickname;
                }
            }

            GM_xmlhttpRequest({
                method: 'POST',
                url: hookUri,
                data: JSON.stringify(data),
                overrideMimeType: 'application/json',
                headers: {
                    'Content-Type': 'application/json'
                },
                onload: (res) => {
                    if (res.status >= 400) {
                        alert('Error send request to Discord. See console (F12).');
                        console.log('Error sending Discord request:', res?.responseText, res);
                    }
                }
            });
        },
        shareButtonsCreate = function (config) {
            if (shareButtons && shareButtons.length) {
                shareButtons.remove();
            }

            shareButtons = $('<div/>');
            let link;
            for (let i = 0; i < config.hooks.length; i++) {
                link = $(getShareLinks(config.hooks[i].title, i));
                link.attr('style', `top: ${i * 16 + 4}px`);
                link.on('click', shareClickHandler);
                link.append(
                    $(getShareLinks(spoilerTitle, i))
                        .attr('title', 'With spoiler')
                        .attr('style', 'display: inline-block')
                        .on('click', shareClickHandler)
                        .append(
                            $(getShareLinks(textMessageTitle, i))
                                .attr('title', 'With text message')
                                .attr('style', 'display: inline-block')
                                .on('click', shareClickHandler)
                        )
                );

                shareButtons.append(link);
            }
        }
    ;
    let $imageContainer,
        shareButtons
    ;

    $('body').append(`<div id="${STORAGE_KEY}" title="Settings of twitter-image-to-discord.user.js">
<p>Fill out fields with Discord hooks.</p>
<p>Where you can find it:
    <a href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" target="_blank">Intro to Webhooks</a>.
</p>
<hr />

<button title="Add more hooks">+</button>
</div>
<a class="${STORAGE_KEY}-button" title="Settings of twitter-image-to-discord.user.js">${settingsIcon}</a>`);

    const dialog = $(`#${STORAGE_KEY}`).dialog({
        resizable: false,
        height: "auto",
        maxHeight: window.innerHeight,
        width: 500,
        modal: false,
        autoOpen: false,
        buttons: {
            "Save": function() {
                saveDialogState(this);

                $(this).dialog("close");
            },
            "Cancel": function() {
                $(this).dialog("close");
            }
        }
    });

    const dialogAddButton = $('button', dialog).on('click', function() {
        $(getHooksForm('', '')).insertBefore(this);
    });

    $(`.${STORAGE_KEY}-button`).on('click', function() {
        dialog.dialog('open');
    });

    loadDialogState();

    shareButtonsCreate(config);

    if (IS_TWEETDECK) {
        $('.js-app')
            .on('mouseenter', '.js-media-image-link', (e) => {
                $imageContainer = $(e.currentTarget);

                $imageContainer.parent().prepend(shareButtons);
            })
        ;
    }
    else {
        setTimeout(function () {
            $('main')
                .on('mouseenter', 'section article img', (e) => {
                    $imageContainer = $(e.currentTarget).closest('a');

                    $imageContainer.prepend(shareButtons);
                })
            ;
        }, 4000);
    }

}

/**
 * @param {string} uri /username/status/1158526558497169408
 *                     /username
 *                     /username/status/1158301826770358273/photo/3
 * @return {string} @username
 */
function extractUsernameFromUri(uri) {
    let result = uri.replace('/', '@'),
        search = result.search(/[/]/)
    ;

    if (search > 0) {
        result = result.substring(0, search);
    }

    return result;
}

function saveConfig(config) {
    return setLocalStorageItem(STORAGE_KEY, JSON.stringify(config));
}

function loadConfig() {
    try {
        return JSON.parse(getLocalStorageItem(STORAGE_KEY))
    } catch (e) {
        console.log('Failed to parse local storage item ' + STORAGE_KEY + ', ' + e + '.');
        return false;
    }
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