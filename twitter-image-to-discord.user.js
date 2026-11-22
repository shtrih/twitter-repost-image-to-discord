// ==UserScript==
// @name         twitter-image-to-discord.user.js
// @namespace    https://github.com/shtrih
// @version      2.10
// @description  Repost Image to Discord via Webhook in one click!
// @author       shtrih
// @match        https://twitter.com/*
// @match        https://tweetdeck.twitter.com/*
// @match        https://x.com/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      discordapp.com
// @connect      discord.com
// @homepage     https://github.com/shtrih/twitter-repost-image-to-discord
// @supportURL   https://github.com/shtrih/twitter-repost-image-to-discord/issues
// @downloadURL  https://github.com/shtrih/twitter-repost-image-to-discord/raw/master/twitter-image-to-discord.user.js
// @updateURL    https://github.com/shtrih/twitter-repost-image-to-discord/raw/master/twitter-image-to-discord.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// ==/UserScript==

/**
 * @see https://discord.com/developers/docs/resources/webhook#execute-webhook
 */

let config;
const STORAGE_KEY = 'twttr-img2dscrd',
    CONTAINER_IMG = 'section article div[data-testid="tweetPhoto"] img:not([alt="Embedded video"])',
    CONTAINER_VID = 'section article div[data-testid="tweetPhoto"]:has([data-testid="playButton"])',
    CONTAINER_VID2 = 'section article div[data-testid="tweetPhoto"]:has(div[data-testid="videoPlayer"])',
    CONTAINER_TEXT = 'section article',
    TYPE_IMG = 'img',
    TYPE_VID = 'vid',
    IMG_SIZES = {
        small: 'small (680px)',
        medium: 'medium (1200px)',
        large: 'large (2048px)',
        orig: 'orig (original)'
    }
;

run();

function run () {
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
        #${STORAGE_KEY} {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            max-width: calc(100vw - 20px);
            max-height: calc(100vh - 20px);
            display: flex;
            flex-direction: column;
            background: #1e1e1e;
            color: #eee;
            border: 1px solid #555;
            border-radius: 4px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, .6);
            z-index: 10000;
            font-size: 14px;
            line-height: 1.4;
        }
        #${STORAGE_KEY}.hidden {
            display: none;
        }
        #${STORAGE_KEY} .dlg-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 10px 14px;
            background: #2a2a2a;
            border-bottom: 1px solid #444;
            border-radius: 4px 4px 0 0;
            font-weight: bold;
        }
        #${STORAGE_KEY} .dlg-title {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        #${STORAGE_KEY} .dlg-body {
            padding: 10px 14px;
            overflow-y: auto;
        }
        #${STORAGE_KEY} .dlg-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 10px 14px;
            background: #2a2a2a;
            border-top: 1px solid #444;
            border-radius: 0 0 4px 4px;
        }
        #${STORAGE_KEY} button {
            background: #3a3a3a;
            color: #eee;
            border: 1px solid #555;
            border-radius: 3px;
            padding: 4px 12px;
            cursor: pointer;
            font: inherit;
        }
        #${STORAGE_KEY} button:hover {
            background: #4a4a4a;
        }
        #${STORAGE_KEY} .dlg-close {
            padding: 0 8px;
            font-size: 16px;
            line-height: 24px;
        }
        #${STORAGE_KEY} .add-hook {
            margin-top: 10px;
            font-size: 16px;
            padding: 2px 14px;
        }
        #${STORAGE_KEY} p {
            margin: 4px 0;
        }
        #${STORAGE_KEY} input[type=text], #${STORAGE_KEY} input[type=url], #${STORAGE_KEY} select {
            width: 100%;
            box-sizing: border-box;
            background: #111;
            color: #eee;
            border: 1px solid #555;
            border-radius: 3px;
            padding: 4px 6px;
            font: inherit;
        }
        #${STORAGE_KEY} input:invalid {
            color: red;
        }
        #${STORAGE_KEY} label {
            display: inline-block;
            width: 100%;
        }
        #${STORAGE_KEY} .hooks {
            display: flex;
            align-items: center;
            border: 1px solid #444;
            border-radius: 4px;
            background: #262626;
            padding: 6px 8px;
            margin: 10px 0 0;
        }
        #${STORAGE_KEY} .drag-handle {
            flex: none;
            cursor: grab;
            padding: 0 8px 0 0;
            color: #999;
            font-size: 16px;
            line-height: 1.2;
            user-select: none;
            -webkit-user-select: none;
        }
        #${STORAGE_KEY} .drag-handle:hover {
            color: #eee;
        }
        #${STORAGE_KEY} .hooks.dragging {
            opacity: .5;
        }
        #${STORAGE_KEY} .hook-fields {
            flex: 1;
            min-width: 0;
        }
        .share-42 {
            position: absolute;
            background: rgba(250, 250, 250, 0.9);
            font-size: 14px;
            padding: 0 2px;
            margin: 0 2px;
            z-index: 2;
            color: #555;
            line-height: 18px;
        }
        .share-42:hover {
            text-decoration: underline;
            cursor: pointer;
        }
        /* tweetdeck */
        html.dark .share-42 {
            background: rgba(21, 32, 43, 0.9);
        }
        .js-mediaembed .share-42 {
            display: none;
        }
    `);

    const settingsIcon = '<svg viewBox="0 0 24 24" class="settings"><g><path d="M12 8.21c-2.09 0-3.79 1.7-3.79 3.79s1.7 3.79 3.79 3.79 3.79-1.7 3.79-3.79-1.7-3.79-3.79-3.79zm0 6.08c-1.262 0-2.29-1.026-2.29-2.29S10.74 9.71 12 9.71s2.29 1.026 2.29 2.29-1.028 2.29-2.29 2.29z"></path><path d="M12.36 22.375h-.722c-1.183 0-2.154-.888-2.262-2.064l-.014-.147c-.025-.287-.207-.533-.472-.644-.286-.12-.582-.065-.798.115l-.116.097c-.868.725-2.253.663-3.06-.14l-.51-.51c-.836-.84-.896-2.154-.14-3.06l.098-.118c.186-.222.23-.523.122-.787-.11-.272-.358-.454-.646-.48l-.15-.014c-1.18-.107-2.067-1.08-2.067-2.262v-.722c0-1.183.888-2.154 2.064-2.262l.156-.014c.285-.025.53-.207.642-.473.11-.27.065-.573-.12-.795l-.094-.116c-.757-.908-.698-2.223.137-3.06l.512-.512c.804-.804 2.188-.865 3.06-.14l.116.098c.218.184.528.23.79.122.27-.112.452-.358.477-.643l.014-.153c.107-1.18 1.08-2.066 2.262-2.066h.722c1.183 0 2.154.888 2.262 2.064l.014.156c.025.285.206.53.472.64.277.117.58.062.794-.117l.12-.102c.867-.723 2.254-.662 3.06.14l.51.512c.836.838.896 2.153.14 3.06l-.1.118c-.188.22-.234.522-.123.788.112.27.36.45.646.478l.152.014c1.18.107 2.067 1.08 2.067 2.262v.723c0 1.183-.888 2.154-2.064 2.262l-.155.014c-.284.024-.53.205-.64.47-.113.272-.067.574.117.795l.1.12c.756.905.696 2.22-.14 3.06l-.51.51c-.807.804-2.19.864-3.06.14l-.115-.096c-.217-.183-.53-.23-.79-.122-.273.114-.455.36-.48.646l-.014.15c-.107 1.173-1.08 2.06-2.262 2.06zm-3.773-4.42c.3 0 .593.06.87.175.79.328 1.324 1.054 1.4 1.896l.014.147c.037.4.367.7.77.7h.722c.4 0 .73-.3.768-.7l.014-.148c.076-.842.61-1.567 1.392-1.892.793-.33 1.696-.182 2.333.35l.113.094c.178.148.366.18.493.18.206 0 .4-.08.546-.227l.51-.51c.284-.284.305-.73.048-1.038l-.1-.12c-.542-.65-.677-1.54-.352-2.323.326-.79 1.052-1.32 1.894-1.397l.155-.014c.397-.037.7-.367.7-.77v-.722c0-.4-.303-.73-.702-.768l-.152-.014c-.846-.078-1.57-.61-1.895-1.393-.326-.788-.19-1.678.353-2.327l.1-.118c.257-.31.236-.756-.048-1.04l-.51-.51c-.146-.147-.34-.227-.546-.227-.127 0-.315.032-.492.18l-.12.1c-.634.528-1.55.67-2.322.354-.788-.327-1.32-1.052-1.397-1.896l-.014-.155c-.035-.397-.365-.7-.767-.7h-.723c-.4 0-.73.303-.768.702l-.014.152c-.076.843-.608 1.568-1.39 1.893-.787.326-1.693.183-2.33-.35l-.118-.096c-.18-.15-.368-.18-.495-.18-.206 0-.4.08-.546.226l-.512.51c-.282.284-.303.73-.046 1.038l.1.118c.54.653.677 1.544.352 2.325-.327.788-1.052 1.32-1.895 1.397l-.156.014c-.397.037-.7.367-.7.77v.722c0 .4.303.73.702.768l.15.014c.848.078 1.573.612 1.897 1.396.325.786.19 1.675-.353 2.325l-.096.115c-.26.31-.238.756.046 1.04l.51.51c.146.147.34.227.546.227.127 0 .315-.03.492-.18l.116-.096c.406-.336.923-.524 1.453-.524z"></path></g></svg>',
        getReposterForm = (reposterNickname, isAuthorInText, imageSize) => `<div class="reposter">
            <p><label>Your nickname:
                <input type="text" placeholder="Optional" name="nickname" value="${reposterNickname}" /></label></p>
            <p>
                Image's author placement:
                <label><input type="radio" name="authorInText" value="0" ${isAuthorInText ? '' : 'checked'} />in nickname</label>
                <label><input type="radio" name="authorInText" value="1" ${isAuthorInText ? 'checked' : ''} />in message text</label>
            </p>
            <p><label>Image size:
                <select name="imageSize">${Object.entries(IMG_SIZES).map(([value, label]) =>
                    `<option value="${value}"${imageSize === value ? ' selected' : ''}>${label}</option>`
                ).join('')}</select>
            </label></p>
        </div>`,
        getHooksForm = (title, hookUri) => `<div class="hooks">
            <span class="drag-handle" title="Drag to sort">&#x280F;</span>
            <div class="hook-fields">
                <p><label>Title: <input type="text" placeholder="Post to Discord" value="${title}" /></label></p>
                <p><label>Webhook URL: <input type="url" placeholder="https://discord.com/api/webhooks/00000000000000000000/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" pattern="^https?:[/]{2}(discord(app)?[.]com)[/].+" value="${hookUri}" /></label></p>
            </div>
        </div>`,
        spoilerTitle = '🕶️',
        textMessageTitle = '📝',
        createShareLink = (title, hookIndex) => {
            const link = document.createElement('div');
            link.className = 'btn-link share-42';
            link.dataset.hookIndex = hookIndex;
            link.textContent = title;
            return link;
        },
        hook = function (title = '', uri = '') {
            return {title, uri}
        },
        convertLegacyConfig = function(config) {
            if (!config.imageSize) {
                config.imageSize = 'medium';
            }
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
                    imageSize: 'medium',
                    hooks: [
                        hook()
                    ]
                }
            }

            formsContainer.insertAdjacentHTML('afterbegin',
                getReposterForm(config.reposterNickname || '', config.authorInText || 0, config.imageSize)
            );
            formsContainer.insertAdjacentHTML('beforeend',
                config.hooks.map((item) => getHooksForm(item.title, item.uri)).join('')
            );
        },
        saveDialogState = function (dialogEl) {
            const cfg = {hooks: []};

            cfg.reposterNickname = dialogEl.querySelector('input[name="nickname"]').value;
            cfg.authorInText = Number(
                dialogEl.querySelector('input[name="authorInText"]:checked')?.value || 0
            );
            cfg.imageSize = dialogEl.querySelector('select[name="imageSize"]').value;

            dialogEl.querySelectorAll('.hooks').forEach(function (block) {
                const inputs = block.querySelectorAll('input'),
                    title = inputs[0].value,
                    uri = inputs[1].value.trim()
                ;
                if (uri) {
                    cfg.hooks.push(hook(title, uri));
                }
            });

            config = cfg;
            saveConfig(cfg);
            shareButtonsCreate(cfg);
        },
        getTweetLink = (container) => {
            return container.closest('article')?.querySelector('time')?.closest('a')?.getAttribute('href')
        },
        getImgURI = (imageContainer) => {
            const img = imageContainer.querySelector('img'),
                size = config.imageSize || 'medium'
            ;
            let imageUri = img.getAttribute('src');

            // External link image has no :orig version
            if (!/[/]card_img[/]/.test(imageUri)) {
                imageUri = img.previousElementSibling
                    .getAttribute('style')
                    // background-image: url("https://pbs.twimg.com/media/EA0z0mvVUAAY1Ck?format=jpg&name=small"); →
                    // → https://pbs.twimg.com/media/EA0z0mvVUAAY1Ck?format=jpg&name=small
                    .replace('filter: brightness(1); ', '')
                    .replace('background-image: url("', '')
                    .replace(/"[)];$/, '')
                ;

                if (size === 'orig') {
                    // → https://pbs.twimg.com/media/EA0z0mvVUAAY1Ck.jpg:orig
                    imageUri = imageUri.replace('?format=', '.').replace(/(&name=[^&]+)?$/, ':orig');
                    return imageUri
                }
            }

            // ?format=jpg&name=small → ?format=jpg&name=<configured size>
            return imageUri.replace(/([?&]name=)[^&]+/, '$1' + size)
        },
        getUserLogin = (container) => {
            return extractUsernameFromUri(getTweetLink(container))
        },
        fixDomain = (uri) => {
            return 'https://fixvx.com' + uri;
        },
        getText = (container) => {
            const
                // Clone so we don't mutate the live DOM
                article = container.closest('article').cloneNode(true),
                xp = new XPathEvaluator()
            ;

            // Replace emoji images with their alt text
            // <img alt="😭" src="https://abs-0.twimg.com/emoji/v2/svg/1f62d.svg">
            article.querySelectorAll('img[alt]').forEach(img => {
                img.replaceWith(document.createTextNode(img.alt));
            });

            let result = xp.evaluate('div/div/div[2]/div[2]/div[2]', article, null, XPathResult.STRING_TYPE).stringValue
            if (result) {
                return result
            }
            return xp.evaluate('div/div/div[3]/div', article, null, XPathResult.STRING_TYPE).stringValue;
        },
        shareClickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const
                data = {
                    // content    string   the message contents (up to 2000 characters)	one of content, file, embeds
                    // username   string   override the default username of the webhook	false
                }
                , shareLink = e.target.closest('.share-42')
                , hookUri = config.hooks[ shareLink.dataset.hookIndex ].uri
            ;
            let content = ``,
                byNickname = getUserLogin(btnsContainer)
            ;
            if (containerType === TYPE_IMG) {
                content = getImgURI(btnsContainer)
            } else if (containerType === TYPE_VID) {
                content = fixDomain(getTweetLink(btnsContainer))
            }

            if (shareLink.textContent === spoilerTitle+textMessageTitle) {
                content = `|| ${content} ||`;
            } else if (shareLink.textContent === textMessageTitle) {
                let message = prompt("Enter your message", getText(btnsContainer));
                if (message === null) {
                    return
                }
                else if (message !== "") {
                    content = `${message}\n${content}`;
                }
            }

            if (config.reposterNickname) {
                byNickname = config.reposterNickname + ' 🔁 ' + byNickname;

                if (config.authorInText) {
                    content = 'by `' + byNickname + '`:\n' + content;
                    byNickname = config.reposterNickname;
                }
            }

            data.username = byNickname;
            data.content = content;

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
        shareButtonsCreate = function (cfg) {
            if (shareButtons) {
                shareButtons.remove();
            }

            shareButtons = document.createElement('div');
            for (let i = 0; i < cfg.hooks.length; i++) {
                const link = createShareLink(cfg.hooks[i].title, i);
                link.setAttribute('style', `top: ${i * 16 + 4}px`);
                link.addEventListener('click', shareClickHandler);

                const spoilerLink = createShareLink(spoilerTitle, i);
                spoilerLink.title = 'With spoiler';
                spoilerLink.setAttribute('style', 'display: inline-block');
                spoilerLink.addEventListener('click', shareClickHandler);

                const textLink = createShareLink(textMessageTitle, i);
                textLink.title = 'With text message';
                textLink.setAttribute('style', 'display: inline-block');
                textLink.addEventListener('click', shareClickHandler);

                spoilerLink.append(textLink);
                link.append(spoilerLink);
                shareButtons.append(link);
            }
        }
    ;
    let btnsContainer,
        containerType,
        shareButtons
    ;

    document.body.insertAdjacentHTML('beforeend', `
<div id="${STORAGE_KEY}" class="hidden" role="dialog" aria-label="Settings of twitter-image-to-discord.user.js">
<div class="dlg-header">
    <span class="dlg-title">Settings of twitter-image-to-discord.user.js</span>
    <button type="button" class="dlg-close" title="Close">&times;</button>
</div>
<div class="dlg-body">
    <p>Fill out fields with Discord hooks.</p>
    <p>Where you can find it:
        <a href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" target="_blank">Intro to Webhooks</a>.
    </p>
    <div class="dlg-forms"></div>
    <button type="button" class="add-hook" title="Add more hooks">+</button>
</div>
<div class="dlg-footer">
    <button type="button" class="dlg-save">Save</button>
    <button type="button" class="dlg-cancel">Cancel</button>
</div>
</div>
<a class="${STORAGE_KEY}-button" title="Settings of twitter-image-to-discord.user.js">${settingsIcon}</a>`);

    const dialog = document.getElementById(STORAGE_KEY),
        formsContainer = dialog.querySelector('.dlg-forms'),
        dialogAddButton = dialog.querySelector('.add-hook'),
        closeDialog = () => dialog.classList.add('hidden')
    ;

    dialog.querySelector('.dlg-save').addEventListener('click', () => {
        saveDialogState(dialog);
        closeDialog();
    });
    dialog.querySelector('.dlg-cancel').addEventListener('click', closeDialog);
    dialog.querySelector('.dlg-close').addEventListener('click', closeDialog);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !dialog.classList.contains('hidden')) {
            closeDialog();
        }
    });

    dialogAddButton.addEventListener('click', () => {
        formsContainer.insertAdjacentHTML('beforeend', getHooksForm('', ''));
    });

    document.querySelector(`.${STORAGE_KEY}-button`).addEventListener('click', () => {
        dialog.classList.remove('hidden');
    });

    // Hooks sorting: drag & drop by the handle. draggable is enabled only while
    // the pointer is down on the handle, so text selection in the fields is not affected.
    let draggedHook = null;

    formsContainer.addEventListener('mousedown', (e) => {
        const block = e.target.closest('.hooks');
        if (block && e.target.closest('.drag-handle')) {
            block.draggable = true;
        }
    });

    formsContainer.addEventListener('dragstart', (e) => {
        const block = e.target.closest('.hooks');
        if (!block || !block.draggable) {
            return;
        }
        draggedHook = block;
        // Firefox skips the drag when there is no data
        e.dataTransfer.setData('text/plain', block.querySelector('input').value);
        e.dataTransfer.effectAllowed = 'move';
        block.classList.add('dragging');
    });

    formsContainer.addEventListener('dragover', (e) => {
        if (!draggedHook) {
            return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        // Insert before the first block whose middle is below the cursor
        const nextBlock = [...formsContainer.querySelectorAll('.hooks:not(.dragging)')]
            .find((el) => {
                const rect = el.getBoundingClientRect();
                return e.clientY < rect.top + rect.height / 2;
            })
        ;
        formsContainer.insertBefore(draggedHook, nextBlock ?? null);
    });

    formsContainer.addEventListener('drop', (e) => e.preventDefault());
    formsContainer.addEventListener('dragend', () => {
        if (draggedHook) {
            draggedHook.classList.remove('dragging');
            draggedHook.draggable = false;
            draggedHook = null;
        }
    });
    // Plain click on the handle starts no drag — clear the leftover draggable flag
    document.addEventListener('mouseup', () => {
        formsContainer.querySelectorAll('.hooks[draggable="true"]')
            .forEach((el) => el.draggable = false);
    });

    loadDialogState();

    shareButtonsCreate(config);

    // Emulate jQuery's delegated mouseenter/mouseleave: react only when the pointer
    // actually crosses the matched element's boundary.
    const hoverEnter = (selector, handler) => {
        document.addEventListener('mouseover', (e) => {
            const el = e.target.closest(selector);
            if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) {
                handler(el, e);
            }
        });
    };
    const hoverLeave = (selector, handler) => {
        document.addEventListener('mouseout', (e) => {
            const el = e.target.closest(selector);
            if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) {
                handler(el, e);
            }
        });
    };

    // Delegated events on document work no matter when React renders <main>,
    // so no fixed delay is needed and slow page loads don't break the script.
    hoverEnter(CONTAINER_IMG, (el) => {
        containerType = TYPE_IMG;
        btnsContainer = el.closest('a');
        btnsContainer?.prepend(shareButtons);
    });
    hoverEnter(CONTAINER_VID, (el) => {
        containerType = TYPE_VID;
        btnsContainer = el;
        el.prepend(shareButtons);
    });
    hoverEnter(CONTAINER_VID2, (el) => {
        containerType = TYPE_VID;
        btnsContainer = el;
        el.prepend(shareButtons);
    });
    hoverLeave(CONTAINER_TEXT, () => {
        shareButtons.remove();
    });
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
