import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@mui/material";



export default function BaseConfirmation({open, setOpen, title, children, actions}: {open: boolean, setOpen: (v: boolean) => void, title: any, children: React.ReactNode, actions: React.ReactNode}) {
    return (<Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{display: 'flex', alignItems: 'center', gap: 1}}>
            {title}
        </DialogTitle>
        <DialogContent>
            {children}
        </DialogContent>
        <DialogActions sx={{px: 3, pb: 2}}>
            {actions}
        </DialogActions>
    </Dialog>)
}