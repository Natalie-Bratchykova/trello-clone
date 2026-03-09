import { Container, Card, CardContent, Skeleton, Box } from '@mui/material';

export default function ProjectsSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="text" width={300} height={20} />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Card key={item}>
            <CardContent>
              <Skeleton variant="rectangular" height={8} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="80%" height={30} />
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Skeleton variant="rounded" width={80} height={24} />
                <Skeleton variant="rounded" width={80} height={24} />
              </Box>
              <Skeleton variant="text" width="60%" sx={{ mt: 2 }} />
            </CardContent>
            <Box sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton variant="rounded" width={100} height={36} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rounded" width={80} height={36} />
                <Skeleton variant="rounded" width={80} height={36} />
              </Box>
            </Box>
          </Card>
        ))}
      </Box>
    </Container>
  );
}

