import {t} from "i18next";
import {useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Settings from "@mui/icons-material/Settings";
import ArrowBack from "@mui/icons-material/ArrowBack";
import DeleteSweep from "@mui/icons-material/DeleteSweep";
import BoardDangerMenu from "../BoardDangerMenu.tsx"
export default function BoardHeader (props){
    const navigate = useNavigate();
    const {board, id, setDangerMenuAnchor } = props;
    return(
        <Box sx={{ backgroundColor: board.color, color: 'white', py: 2 }}>
            <Container maxWidth={false}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => history.back()} sx={{ color: 'white' }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h5" sx={{ fontWeight: 600, flex: 1 }}>
                        {board.title}
                    </Typography>
                    <IconButton onClick={() => navigate(`/board/${id}/edit`)} sx={{ color: 'white' }} title={t('board.projectSettings')}>
                        <Settings />
                    </IconButton>
                    <IconButton
                        onClick={(e) => setDangerMenuAnchor(e.currentTarget)}
                        sx={{ color: 'white' }}
                        title={t('board.dangerActions')}
                    >
                        <DeleteSweep />
                    </IconButton>
                    <BoardDangerMenu />
                </Box>
            </Container>
        </Box>
    )
}