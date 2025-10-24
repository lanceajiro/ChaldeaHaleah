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
  guide: [''],
};

// Function to fetch a random recipe
async function fetchRecipe() {
  try {
    const res = await axios.get('https://www.themealdb.com/api/json/v1/1/random.php', {
      headers: { Accept: 'application/json' },
      timeout: 8000, // Add timeout to prevent hanging
    });
    return res.data?.meals?.[0] || null;
  } catch (error) {
    console.error('Error fetching recipe:', error.message);
    return null;
  }
}

// Helper to generate recipe message
function generateRecipeMessage(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim() !== '') {
      ingredients.push(`- ${ingredient}${measure ? ` (${measure.trim()})` : ''}`);
    }
  }

  let caption = `🍽️ *Random Recipe: ${meal.strMeal}*\n\n` +
    `📂 *Category:* ${meal.strCategory}\n\n` +
    `📝 *Instructions:*\n${meal.strInstructions}\n\n` +
    `🥕 *Ingredients:*\n${ingredients.join('\n')}`;

  // Truncate caption if it exceeds Telegram's 1024-character limit
  if (caption.length > 1024) {
    caption = caption.substring(0, 1000) + '...';
  }

  return caption;
}

export async function onStart({ bot, msg, chatId, response }) {
  const loadingMsg = await response.reply('🍳 *Fetching a random recipe...*', { parse_mode: 'Markdown' });

  try {
    const meal = await fetchRecipe();
    if (!meal) {
      await response.editText(loadingMsg, '⚠️ Could not retrieve a recipe from the API.', {
        parse_mode: 'Markdown',
      });
      return;
    }

    const caption = generateRecipeMessage(meal);

    // Send the photo with the correct messageId in callback_data
    const sentMsg = await response.photo(meal.strMealThumb, {
      caption,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🔁 Refresh',
              callback_data: JSON.stringify({
                command: 'recipe',
                messageId: null, // Will be updated after sending
                args: ['refresh'],
              }),
            },
          ],
        ],
      },
    });

    // Update callback_data with the correct messageId
    const updatedKeyboard = [
      [
        {
          text: '🔁 Refresh',
          callback_data: JSON.stringify({
            command: 'recipe',
            messageId: sentMsg.message_id,
            args: ['refresh'],
          }),
        },
      ],
    ];

    await response.editMarkup(sentMsg, { inline_keyboard: updatedKeyboard });

    // Delete loading message
    await response.delete(loadingMsg);
  } catch (error) {
    console.error('Error in recipe onStart:', error);
    await response.editText(loadingMsg, `⚠️ Failed to fetch recipe: ${error.message}`, {
      parse_mode: 'Markdown',
    });
  }
}

export async function onCallback({ bot, callbackQuery }) {
  try {
    // Parse callback data
    if (!callbackQuery || !callbackQuery.data) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Invalid button data.' });
      return;
    }

    let payload;
    try {
      payload = JSON.parse(callbackQuery.data);
    } catch (error) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Invalid button data format.' });
      return;
    }

    // Validate callback
    if (payload.command !== 'recipe') {
      return; // Silently ignore unrelated callbacks
    }

    if (!payload.messageId || callbackQuery.message.message_id !== payload.messageId) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Invalid or outdated button.' });
      return;
    }

    // Check if refresh is requested
    if (payload.args?.[0] !== 'refresh') {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Unknown action.' });
      return;
    }

    // Fetch new recipe
    const meal = await fetchRecipe();
    if (!meal) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Failed to fetch a new recipe.' });
      return;
    }

    const caption = generateRecipeMessage(meal);

    // Update the message with new photo and caption
    const updatedKeyboard = [
      [
        {
          text: '🔁 Refresh',
          callback_data: JSON.stringify({
            command: 'recipe',
            messageId: payload.messageId,
            args: ['refresh'],
          }),
        },
      ],
    ];

    await bot.editMessageMedia(
      {
        type: 'photo',
        media: meal.strMealThumb,
        caption,
        parse_mode: 'Markdown',
      },
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: payload.messageId,
        reply_markup: { inline_keyboard: updatedKeyboard },
      }
    );

    await bot.answerCallbackQuery(callbackQuery.id, { text: 'Recipe refreshed!' });
  } catch (error) {
    console.error('Error in recipe callback:', error);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Failed to refresh recipe. Please try again.' });
    } catch (innerErr) {
      console.error('Failed to answer callback query:', innerErr.message);
    }
  }
}