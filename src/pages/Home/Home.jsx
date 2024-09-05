import { Helmet } from 'react-helmet-async'
import { styled } from '@mui/material/styles'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

import logo from 'assets/logoWhite.svg'

import { ForStudents } from './ForStudents'
import { ForTeachers } from './ForTeachers'

export function Home() {
  return <>
    <Helmet><title>DigiTeach Simulator</title></Helmet>
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
    alignItems: 'center',
    display: 'flex',
    flexFlow: 'row nowrap',
    justifyContent: 'center',
    placeItems: 'center',

    '& .logo': {
      display: 'block',
      height: 'min(13vw, 11rem)',
      margin: '0 6% 0 6%',
      width: 'min(13vw, 11rem)',
    },

    '& .title': {
      flexGrow: 0,
      fontSize: 'min(4.5vw, 5rem)',
      fontWeight: 500,
      marginRight: '8vw',
      transform: 'translateY(-0.4vw)',
    },
  },
}))

export function TitleBar() {
  return <TitleBarBox>
    <Container maxWidth="xl" sx={{ flexGrow: 1 }} className="container">
      <img src={logo} className="logo" />
      <div className="title">
        DigiTeach Simulator
      </div>
    </Container>
  </TitleBarBox>
}

const Block = styled(Grid)(({ theme }) => ({
  '& > div': {
    alignItems: 'center',
    display: 'flex',
    flexFlow: 'column nowrap',
    padding: '0 2rem',
    textAlign: 'center',

    [theme.breakpoints.down('md')]: {
      marginBottom: '1rem',
      padding: '0 1rem',
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
  return <Container maxWidth="xl">
    <Grid container>
      <Block item xs={12} md={6}>
        <ForStudents />
      </Block>
      <Block item xs={12} md={6}>
        <ForTeachers />
      </Block>
    </Grid>
  </Container>
}
