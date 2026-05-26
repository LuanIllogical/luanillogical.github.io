
# How to use

Instructions on how to use all of the features of the Github User Dossier for your own profile.

## 📁 Custom Groups of Repositories

Add to the top of your user README.md:

```
<!--
gud-repo-groups:
First Custom Group Name = name-of-the-first-repository, name-of-the-second-repository
Second Custom Group Name = name-of-the-third-repository
-->
```

You can add however many groups you want, with however many repositories you want!

## 🌐 Translations for user README

Wrap your original README.md and your translations in these tags:
```
<!--
language-begin = EN
-->
<div align="center">
<h2>Hi there!</h2>
</div>
<!--
language-end = EN
-->

<!--
language-begin = PT-BR
<div align="center">
<h2>Olá!</h2>
</div>
language-end = PT-BR
-->
```

The default language of your README should close the language-begin (-->) and open the language-end (<!--) tags so that is visible on your regular GitHub user README, while the additional translation should only open and close the hidden tag once, containing the whole translation.
You can also add however many languages you want!
