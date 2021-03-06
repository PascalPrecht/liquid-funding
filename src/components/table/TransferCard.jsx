import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import { Formik } from 'formik'
import LiquidPledging from '../../embarkArtifacts/contracts/LiquidPledging'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Collapse from '@material-ui/core/Collapse'
import { getTokenLabel, getTokenByAddress } from '../../utils/currencies'
import styles from './CardStyles'
import { useRowData } from './hooks'

const { transfer } = LiquidPledging.methods

function TransferCard({ row, handleClose, classes }) {
  const { show, close } = useRowData(row, handleClose)
  return (
    <Formik
      initialValues={{}}
      onSubmit={async (values, { setSubmitting: _setSubmitting, resetForm, setStatus: _setStatus }) => {
        const { idPledge, pledge } = row
        const { idSender, amount, idReceiver } = values
        const { chainReadibleFn } = getTokenByAddress(pledge.token)
        const args = [idSender, idPledge, chainReadibleFn(amount), idReceiver]
        const toSend = transfer(...args)
        const estimatedGas = await toSend.estimateGas()

        toSend
          .send({gas: estimatedGas + 1000})
          .then(async res => {
            console.log({res})
            const { events: { Transfer } } = res
            if (Array.isArray(Transfer)) {
              Transfer.forEach(async t => {
                const { to, amount } = t.returnValues
                await pledge.transferTo(to, amount)
              })
            } else {
              const { to, amount } = Transfer.returnValues
              await pledge.transferTo(to, amount)
            }
          })
          .catch(e => {
            console.log({e})
          })
          .finally(() => {
            close()
            resetForm()
          })
      }}
    >
      {({
        values,
        errors: _errors,
        touched: _touched,
        handleChange,
        handleBlur,
        handleSubmit,
        submitForm: _submitForm,
        setFieldValue: _setFieldValue,
        setStatus: _setStatus,
        status: _status
      }) => (
        <Collapse in={show} >
          <form onSubmit={handleSubmit} autoComplete="off">
            <Card className={classes.card} elevation={0}>
              <CardContent>
                <Typography variant="h6" component="h2">Transfer Funds</Typography>
                <Typography variant="subheading">
                  {`Transfer ${values.amount || ''}  ${values.amount && row ? getTokenLabel(row.pledge.token) : ''} from Pledge ${row.idPledge} ${values.idReceiver ? 'to Giver/Delegate/Project' : ''} ${values.idReceiver || ''}`}
                </Typography>
                <TextField
                  autoFocus
                  margin="normal"
                  id="amount"
                  name="amount"
                  label="Amount to transfer"
                  placeholder="Amount to transfer"
                  variant="outlined"
                  autoComplete="off"
                  fullWidth
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.amount || ''}
                />
                <TextField
                  margin="normal"
                  id="idSender"
                  name="idSender"
                  label="Profile Id to send from"
                  placeholder="Profile Id to send from"
                  variant="outlined"
                  type="number"
                  autoComplete="off"
                  fullWidth
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.idSender || ''}
                />
                <TextField
                  margin="normal"
                  id="idReceiver"
                  name="idReceiver"
                  label="Receiver of funds"
                  placeholder="Receiver of funds"
                  variant="outlined"
                  helperText="Destination of the amount, can be a Giver/Project sending to a Giver, a Delegate or a Project; a Delegate sending to another Delegate, or a Delegate pre-commiting it to a Project"
                  autoComplete="off"
                  fullWidth
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.idReceiver || ''}
                />
                <CardActions>
                  <Button size="large" onClick={close}>
                    Cancel
                  </Button>
                  <Button size="large" color="primary" type="submit">
                    Transfer
                  </Button>
                </CardActions>
              </CardContent>
            </Card>
          </form>
        </Collapse>
      )}
    </Formik>
  )
}

TransferCard.propTypes = {
  classes: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
  handleClose: PropTypes.func.isRequired,
}

export default withStyles(styles)(TransferCard)
