
# How to use

Instructions on how to use all of the features of the Github User Dossier for your own profile.

<details>
<summary>Table of contents (Click to show)</summary>

- [Immediately open with your profile](#immediately-open-with-your-profile)
- [Multiple Tags](#multiple-tags)
- [Custom Groups of Repositories](#custom-groups-of-repositories)
- [Custom Background](#custom-background)
- [Translations for user README](#translations-for-user-readme)


</details>
<a id="immediately-open-with-your-profile"></a>

## 👤 Immediately open with your profile

Add a ?user=yourusername to the end of the link, like
https://luanillogical.github.io/?user=LuanIllogical.

<a id="multiple-tags"></a>
## 🏷 Multiple Tags

You can easily add multiple tags in the following way:

```
<!--
gud-first-tag: {
First tag definition
}
gud-second-tag: {
Second tag definition
}
-->
```

All tags except translations can be added this way!

<a id="custom-groups-of-repositories"></a>
## 📁 Custom Groups of Repositories

Add this hidden tag to the top of your user README.md:

```
<!--
gud-repo-groups: {
First Custom Group Name = name-of-the-first-repository, name-of-the-second-repository
Second Custom Group Name = name-of-the-third-repository
}
-->
```

You can add however many groups you want, with however many repositories you want!

<a id="custom-background"></a>
## 🟦 Custom Background

Add this hidden tag to the top of your user README.md:

```
<!--
gud-background: {
linear-gradient(to top, #750da8, #000960)
}
-->
```

You can use whatever CSS styling you'd put in the ``background`` field of the ``body``.

<a id="translations-for-user-readme"></a>
## 🌐 Translations for user README

Wrap your original README.md and your translations in these tags:
```
<!--
gud-language-begin = EN
-->
<div align="center">
<h2>Hi there!</h2>
</div>
<!--
gud-language-end = EN
-->

<!--
gud-language-begin = PT-BR
<div align="center">
<h2>Olá!</h2>
</div>
gud-language-end = PT-BR
-->
```

The default language of your README should close the language-begin (-->) and open the language-end (<!--) tags so that is visible on your regular GitHub user README, while the additional translation should only open and close the hidden tag once, containing the whole translation.
You can also add however many languages you want!
