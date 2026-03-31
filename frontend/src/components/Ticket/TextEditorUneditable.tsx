import {Box} from "@mui/material";

export default function TextEditorUneditable({html}) {
    console.log('html in uneditable', html)
     return(
    <Box
         sx={{
             backgroundColor: 'action.hover',
             borderRadius: 1,
             p: 2,
             mb: 2,
             wordBreak:'break-word',
             '& p': { m: 0, mb: 1 },
             '& p:last-child': { mb: 0 },
             '& ul, & ol': { pl: 3, m: 0, mb: 1, listStylePosition: 'outside' },
             '& li': { wordBreak:'break-word' },
             '& h1, & h2, & h3': { mt: 1, mb: 0.5 },
             '& blockquote': {
                 borderLeft: '3px solid',
                 borderColor: 'divider',
                 pl: 2,
                 ml: 0,
                 color: 'text.secondary',
             },
             '& pre': {
                 backgroundColor: 'grey.900',
                 color: 'grey.100',
                 p: 1.5,
                 borderRadius: 1,
                 overflow: 'auto',
             },
             '& a': { color: 'primary.main' },
             fontSize: '0.95rem',
             lineHeight: 1.7,
         }}
         dangerouslySetInnerHTML={{ __html: html }}
     />)
}