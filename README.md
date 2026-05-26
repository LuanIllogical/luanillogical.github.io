
# How to use

Instructions on how to use all of the features of the Github User Dossier for your own profile.

<details>
<summary>Table of contents (Click to show)</summary>

- [Immediately open with your profile](#immediately-open-with-your-profile)
- [Custom Groups of Repositories](#custom-groups-of-repositories)
- [Translations for user README](#translations-for-user-readme)

</details>
<a id="immediately-open-with-your-profile"></a>

## 👤 Immediately open with your profile

Add a ?user=yourusername to the end of the link, like
https://luanillogical.github.io/?user=LuanIllogical.
<a id="custom-groups-of-repositories"></a>
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
<a id="translations-for-user-readme"></a>
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
