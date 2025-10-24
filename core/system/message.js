/**
 * Lightweight response wrapper around node-telegram-bot-api for concise replies.
 * Automatically replies to the triggering message in groups unless disabled via { noReply: true }.
 */
export class Response {
  constructor(bot, msg) {
    this.bot = bot;
    this.msg = msg;
    this.chatId = msg.chat.id;
  }

  _getOptions(options = {}) {
    const finalOptions = { ...options };
    if (this.msg.chat.type !== 'private' && !options.noReply && !('reply_to_message_id' in options)) {
      finalOptions.reply_to_message_id = this.msg.message_id;
    }
    if ('noReply' in finalOptions) {
      delete finalOptions.noReply;
    }
    return finalOptions;
  }

  /** Send a text message */
  reply(text, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendMessage(this.chatId, text, finalOptions);
  }

  /** Send a photo */
  photo(photo, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendPhoto(this.chatId, photo, finalOptions);
  }

  audio(audio, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendAudio(this.chatId, audio, finalOptions);
  }

  document(document, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendDocument(this.chatId, document, finalOptions);
  }

  sticker(sticker, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendSticker(this.chatId, sticker, finalOptions);
  }

  video(video, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendVideo(this.chatId, video, finalOptions);
  }

  animation(animation, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendAnimation(this.chatId, animation, finalOptions);
  }

  voice(voice, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendVoice(this.chatId, voice, finalOptions);
  }

  videoNote(videoNote, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendVideoNote(this.chatId, videoNote, finalOptions);
  }

  mediaGroup(media, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendMediaGroup(this.chatId, media, finalOptions);
  }

  location(latitude, longitude, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendLocation(this.chatId, latitude, longitude, finalOptions);
  }

  venue(latitude, longitude, title, address, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendVenue(this.chatId, latitude, longitude, title, address, finalOptions);
  }

  contact(phoneNumber, firstName, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendContact(this.chatId, phoneNumber, firstName, finalOptions);
  }

  poll(question, pollOptions, options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendPoll(this.chatId, question, pollOptions, finalOptions);
  }

  dice(options = {}) {
    const finalOptions = this._getOptions(options);
    return this.bot.sendDice(this.chatId, finalOptions);
  }

  /** Notify all configured bot owners */
  forOwner(text, options = {}) {
    const ownerIds = global.settings.owner || [];
    const promises = ownerIds.map(ownerId => this.bot.sendMessage(ownerId, text, options));
    return Promise.all(promises);
  }

  /** Backward-compat alias; prefer forOwner */
  forAdmin(text, options = {}) {
    return this.forOwner(text, options);
  }
}

// Backward-compat export for legacy imports
export const Message = Response;
