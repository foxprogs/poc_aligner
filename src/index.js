const { default: axios } = require('axios');
const usfm = require('usfm-js');

import './styles.css';

export const formatUsfm = () => {
  axios.get(document.querySelector('#url').value).then((data) => {
    parseUsfm(usfm.toJSON(data.data));
  });
}

/**
 * dive down into milestone to extract words and text
 * @param {Object} verseObject - milestone to parse
 * @return {string} text content of milestone
 */
const parseMilestone = verseObject => {
  let text = verseObject.text || '';
  let wordSpacing = '';
  const length = verseObject.children ? verseObject.children.length : 0;

  for (let i = 0; i < length; i++) {
    let child = verseObject.children[i];

    switch (child.type) {
    case 'word':
      text += wordSpacing + child.text;
      wordSpacing = ' ';
      break;

    case 'milestone':
      text += wordSpacing + parseMilestone(child);
      wordSpacing = ' ';
      break;

    default:
      if (child.text) {
        text += child.text;
        const lastChar = text.substr(-1);

        if ((lastChar !== ',') && (lastChar !== '.') && (lastChar !== '?') && (lastChar !== ';')) { // legacy support, make sure padding before word
          wordSpacing = '';
        }
      }
      break;
    }
  }
  return text;
};

export const parseUsfm = (toJSON) => {
  const chapters = toJSON.chapters;
  let res = '';
  for (let cindex in chapters) {
    const chapter = chapters[cindex];
    res += '<div class="chapterHeader">Глава ' + cindex + '</div><div class="chapter">';
    for (let vindex in chapter) {
      const verse = chapter[vindex];
      res += '<div class="verseHeader">Стих ' + vindex + '</div><div class="verse">';
      verse.verseObjects.forEach((verseObject) => {
        console.log(verseObject);
        if (verseObject.tag == 'zaln') {
          let vo = { ...verseObject };
          let t = '<div class="word"><div class="top">';
          while (vo.type == 'milestone' && vo.tag == 'zaln') {
            t += vo.content + ' (<span class="strong">'+vo.strong+'</span>) ';
            vo = { ...vo.children[0] };
          }
          res +=
            t + '</div><div class="bottom">' + parseMilestone(verseObject) + '</div></div>';
        }
        if (verseObject.text) {
          res += verseObject.text;
        }
      });
      res += '</div>';
    }
    res += '</div>';
  }
  document.querySelector('.result').innerHTML = res;
};
document.querySelector("#click").addEventListener('click', formatUsfm);
