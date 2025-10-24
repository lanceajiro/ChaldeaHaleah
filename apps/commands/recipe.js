import axios from 'axios';

export const meta = {
  name: 'recipe',
  version: '1.0.0',
  aliases: ['meal', 'food'],
  description: 'Get a random recipe from TheMealDB',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

// Function to fetch a random recipe
async function fetchRecipe() {
  const res = await axios.get('https://www.themealdb.com/api/json/v1/1/random.php', {
    headers: { Accept: 'application/json' }
  });
  return res.data?.meals?.[0] || null;
}

export async function onStart({ bot, msg, chatId, response }) {
  const loadingMsg = await response.reply('🍳 *Fetching a random recipe...*', { parse_mode: 'Markdown' });

  try {
    const meal = await fetchRecipe();
    if (!meal) {
      await response.editText(loadingMsg, '⚠️ Could not retrieve a recipe from the API.', { parse_mode: 'Markdown' });
      return;
    }

    // Collect ingredients
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim() !== '') {
        ingredients.push(`- ${ingredient}${measure ? ` (${measure.trim()})` : ''}`);
      }
    }

    const caption = `🍽️ *Random Recipe: ${meal.strMeal}*\n\n` +
      `📂 *Category:* ${meal.strCategory}\n\n` +
      `📝 *Instructions:*\n${meal.strInstructions}\n\n` +
      `🥕 *Ingredients:*\n${ingredients.join('\n')}`;

    // Inline keyboard with refresh button
    const inlineKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'recipe',
            messageId: null,
            args: ['refresh']
          })
        }
      ]
    ];

    // Edit loading message to show recipe image + info
    await response.delete(loadingMsg);

    const sentMsg = await response.photo(meal.strMealThumb, {
      caption,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineKeyboard }
    });

    // Update inline keyboard to include correct messageId
    const updatedKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'recipe',
            messageId: sentMsg.message_id,
            args: ['refresh']
          })
        }
      ]
    ];

    await response.editMarkup(sentMsg, { inline_keyboard: updatedKeyboard });

  } catch (error) {
    await response.editText(loadingMsg, `⚠️ Failed to fetch recipe: ${error.message}`, { parse_mode: 'Markdown' });
  }
}

// Callback handler for refresh button
export async function onCallback({ bot, callbackQuery, payload }) {
  try {
    if (payload.command !== 'recipe') return;
    if (!payload.messageId || callbackQuery.message.message_id !== payload.messageId) return;

    const meal = await fetchRecipe();
    if (!meal) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Failed to fetch recipe.' });
      return;
    }

    // Collect ingredients
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim() !== '') {
        ingredients.push(`- ${ingredient}${measure ? ` (${measure.trim()})` : ''}`);
      }
    }

    const caption = `🍽️ *Random Recipe: ${meal.strMeal}*\n\n` +
      `📂 *Category:* ${meal.strCategory}\n\n` +
      `📝 *Instructions:*\n${meal.strInstructions}\n\n` +
      `🥕 *Ingredients:*\n${ingredients.join('\n')}`;

    const updatedKeyboard = [
      [
        {
          text: '🔁',
          callback_data: JSON.stringify({
            command: 'recipe',
            messageId: payload.messageId,
            args: ['refresh']
          })
        }
      ]
    ];

    await bot.editMessageMedia(
      {
        type: 'photo',
        media: meal.strMealThumb,
        caption,
        parse_mode: 'Markdown'
      },
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: payload.messageId,
        reply_markup: { inline_keyboard: updatedKeyboard }
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error('Error in recipe callback:', err);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred. Please try again.' });
    } catch (innerErr) {
      console.error('Failed to answer callback query:', innerErr.message);
    }
  }
}
