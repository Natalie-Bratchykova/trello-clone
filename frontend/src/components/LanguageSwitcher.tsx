import {memo, useMemo, useState} from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import {useTranslation} from "react-i18next";
import Language from "@mui/icons-material/Language";
const LANGUAGES = [
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

function LanguageSwitcher() {
    const { i18n } = useTranslation(undefined, { useSuspense: false });
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const currentLang = useMemo(
        () => LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0],
        [i18n.language]
    );

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleChange = (code: string) => {
        i18n.changeLanguage(code);
        handleClose();
    };

    return (
        <>
            <IconButton onClick={handleOpen} size="small" color="inherit">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Language sx={{ fontSize: 20 }} />
                    <Typography variant="caption">
                        {currentLang.flag}
                    </Typography>
                </Box>
            </IconButton>

            {anchorEl && (
                <Menu
                    anchorEl={anchorEl}
                    open
                    onClose={handleClose}
                >
                    {LANGUAGES.map((lang) => (
                        <MenuItem
                            key={lang.code}
                            selected={lang.code === i18n.language}
                            onClick={() => handleChange(lang.code)}
                        >
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <span>{lang.flag}</span>
                                <Typography>{lang.label}</Typography>
                            </Box>
                        </MenuItem>
                    ))}
                </Menu>
            )}
        </>
    );
}

export default memo(LanguageSwitcher);