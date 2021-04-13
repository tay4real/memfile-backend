function defaultAvatar(firstname, surname) {
  return `https://eu.ui-avatars.com/api/?name=${firstname}+${surname}&background=random&bold=true`;
}

module.exports = { defaultAvatar };
