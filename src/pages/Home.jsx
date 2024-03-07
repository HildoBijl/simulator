import { useNavigate } from 'react-router-dom'
import { styled } from '@mui/material/styles'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'

import logo from '../assets/logoWhite.svg'

export function Home() {
  return <>
    <TitleBar />
    <Blocks />
  </>
}

const TitleBarBox = styled(Box)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: 'white',
  marginBottom: '2rem',
  padding: '2rem',

  '& .container': {
    display: 'flex',
    flexFlow: 'row nowrap',
    placeItems: 'center',

    '& .logo': {
      display: 'block',
      height: 'min(11vw, 11rem)',
      margin: '0 4% 0 6%',
      width: 'min(11vw, 11rem)',
    },

    '& .title': {
      flexGrow: 1,
      fontSize: 'min(7vw, 7rem)',
    },
  },
}))

export function TitleBar() {
  return <TitleBarBox>
    <Container maxWidth="xl" sx={{ flexGrow: 1 }} className="container">
      <img src={logo} className="logo" />
      <div className="title">
        Führungssimulator
      </div>
    </Container>
  </TitleBarBox>
}

const Block = styled(Grid)(({ theme }) => ({
  '& > div': {
    alignItems: 'center',
    display: 'flex',
    flexFlow: 'column nowrap',
    padding: '0 3rem',
    textAlign: 'center',

    [theme.breakpoints.down('md')]: {
      marginBottom: '2rem',
    },

    '& h2': {
      margin: '0.5rem',
    },

    '& button': {
      margin: '0.8rem',
    },
  },
}))

export function Blocks() {
  const navigate = useNavigate()
  return <Container maxWidth="xl">
    <Grid container>
      <Block item xs={12} md={6}>
        <div>
          <h2>Für Studierenden</h2>
          <p>Sie sollten von Ihrem Lehrer/in einen direkten Link zu einem bestimmten Spiel erhalten.</p>
        </div>
      </Block>
      <Block item xs={12} md={6}>
        <div>
          <h2>Für Lehrenden</h2>
          <p>Sie können Ihre eigenen Simulationen erstellen und sie mit Ihren Studierenden teilen.</p>
          <Button variant="contained"onClick={() => navigate('/create')}>Eine neue Simulation erstellen</Button>
        </div>
      </Block>
    </Grid>
  </Container>
}
